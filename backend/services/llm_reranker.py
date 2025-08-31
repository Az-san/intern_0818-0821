"""
LLM ベースの再ランキングサービス。

- 入力: 顧客/制約と候補スポット一覧（軽量要約済み）
- 出力: JSON スキーマ準拠の ranked/rejected 配列

環境変数:
- OPENAI_API_KEY: 存在すれば OpenAI Chat Completions を HTTP 経由で呼び出し
- OPENAI_BASE_URL: 代替エンドポイント（任意）
- OPENAI_MODEL: 使用モデル（既定: gpt-4o-mini）

外部APIに失敗/未設定の場合は、ルールベースのフォールバックで再ランキングします。
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional, Tuple

import requests
from jsonschema import validate, ValidationError


SUGGEST_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "properties": {
        "ranked": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "score": {"type": "number"},
                    "reasons": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["id", "score"],
                "additionalProperties": True,
            },
        },
        "rejected": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "reasons": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["id"],
                "additionalProperties": True,
            },
        },
        "meta": {"type": "object"},
    },
    "required": ["ranked", "rejected"],
    "additionalProperties": True,
}


class LLMReranker:
    def __init__(self) -> None:
        self.openai_api_key: Optional[str] = os.getenv("OPENAI_API_KEY")
        self.openai_base_url: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self.openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    def rerank(
        self,
        customer: Dict[str, Any],
        constraints: Dict[str, Any],
        candidates: List[Dict[str, Any]],
        top_k: int = 10,
        model_profile: str = "balanced",
    ) -> Dict[str, Any]:
        """再ランキングを行い、SUGGEST_SCHEMA 準拠の dict を返す。"""
        # 1) OpenAI 呼び出し（可能なら）
        if self.openai_api_key and candidates:
            try:
                llm = self._call_openai(customer, constraints, candidates, top_k, model_profile)
                if llm:
                    validate(instance=llm, schema=SUGGEST_SCHEMA)
                    # ID の整合性チェック
                    self._ensure_ids_exist(llm, candidates)
                    return llm
            except Exception:
                # LLM 失敗時はフォールバック
                pass

        # 2) フォールバック: ルールベースで並べ替え
        ranked, rejected = self._fallback_rank(customer, constraints, candidates, top_k)
        return {
            "ranked": ranked,
            "rejected": rejected,
            "meta": {"source": "fallback"},
        }

    def _call_openai(
        self,
        customer: Dict[str, Any],
        constraints: Dict[str, Any],
        candidates: List[Dict[str, Any]],
        top_k: int,
        model_profile: str,
    ) -> Optional[Dict[str, Any]]:
        system = (
            "You are a travel planner reranker."
            " Rank items strictly based on constraints (budget, weather, season, accessibility)."
            " Return only JSON with fields: ranked[], rejected[]."
        )
        # 入力をコンパクト化
        brief_candidates = [
            {
                "id": c.get("destination_id") or c.get("id"),
                "name": c.get("name"),
                "category": c.get("category"),
                "indoor": bool(c.get("indoor", False)),
                "barrier_free": bool(c.get("barrier_free", False)),
                "stroller_friendly": bool(c.get("stroller_friendly", False)),
                "price_min_yen": c.get("price_min_yen"),
                "crowd_level": c.get("crowd_level"),
                "duration_min": c.get("estimated_duration_minutes") or c.get("estimated_duration"),
            }
            for c in candidates
        ]
        user = {
            "customer": {
                "id": customer.get("顧客ID") or customer.get("id") or customer.get("customer_id"),
                "adults": customer.get("adults"),
                "children": customer.get("children"),
                "seniors": customer.get("seniors"),
                "needs_stroller": customer.get("needs_stroller"),
                "needs_wheelchair": customer.get("needs_wheelchair"),
                "interests": customer.get("interests", []),
            },
            "constraints": constraints,
            "top_k": top_k,
            "candidates": brief_candidates,
            "output_schema": SUGGEST_SCHEMA,
        }

        url = f"{self.openai_base_url}/chat/completions"
        headers = {"Authorization": f"Bearer {self.openai_api_key}", "Content-Type": "application/json"}
        body = {
            "model": self.openai_model,
            "temperature": 0.2 if model_profile == "quality" else 0.0,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": json.dumps(user, ensure_ascii=False)},
            ],
        }

        resp = requests.post(url, headers=headers, json=body, timeout=30)
        if resp.status_code >= 400:
            return None
        data = resp.json()
        try:
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)
        except Exception:
            return None

    def _fallback_rank(
        self,
        customer: Dict[str, Any],
        constraints: Dict[str, Any],
        candidates: List[Dict[str, Any]],
        top_k: int,
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        budget = constraints.get("budget_yen")
        weather = constraints.get("weather")  # 'sunny'|'rainy'|'cloudy'
        crowd_avoid = constraints.get("crowd_avoid")  # 'off'|'mid'|'high'

        scored: List[Tuple[float, Dict[str, Any]]] = []
        for c in candidates:
            base = float(c.get("recommendation_score") or 0.0)
            score = base

            # 雨天は屋内を加点
            if weather == "rainy" and c.get("indoor"):
                score += 0.2
            # 混雑回避
            crowd = c.get("crowd_level")
            if crowd_avoid in ("mid", "high") and isinstance(crowd, int):
                score += -0.05 * crowd * (2 if crowd_avoid == "high" else 1)
            # 予算: 最低価格が予算超過なら減点
            min_price = c.get("price_min_yen")
            if isinstance(budget, int) and isinstance(min_price, int):
                if min_price > budget:
                    score -= 0.3

            scored.append((score, c))

        scored.sort(key=lambda x: x[0], reverse=True)
        ranked_items = [
            {"id": (c.get("destination_id") or c.get("id") or ""), "score": s}
            for s, c in scored[:top_k]
        ]
        rejected_items = [
            {"id": (c.get("destination_id") or c.get("id") or ""), "reasons": ["low_score"]}
            for s, c in scored[top_k:]
        ]
        return ranked_items, rejected_items

    def _ensure_ids_exist(self, result: Dict[str, Any], candidates: List[Dict[str, Any]]) -> None:
        allowed = {
            (c.get("destination_id") or c.get("id"))
            for c in candidates
        }
        for item in result.get("ranked", []) + result.get("rejected", []):
            if item.get("id") not in allowed:
                raise ValidationError(f"Unknown id in LLM output: {item.get('id')}")


