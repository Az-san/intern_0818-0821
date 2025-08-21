"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Home,
  MessageCircle,
  Users,
  Map,
  ArrowLeft,
  Car,
  Utensils,
  ShoppingBag,
  Footprints,
  Cross,
  Filter,
} from "lucide-react"

type Category = "spots" | "restaurants" | "souvenirs" | "activities" | "travel-plans"
type View =
  | "home"
  | "ai-recommend"
  | "dashboard"
  | "arrangements"
  | "guest-detail"
  | "hotel-map"
  | "request-queue"
  | "congestion"
  | "messages"
  | Category

interface Customer {
  顧客ID: string
  姓: string
  名: string
  年齢: string
  性別コード値: string
  同行者情報: string
  特記事項: string
  使用言語: string
  電話番号: string
  メールアドレス: string
}

interface RoomAssignment {
  roomNumber: string
  customer: Customer
}

const renderHome = (
  setCurrentView: any,
  roomAssignments: RoomAssignment[],
  setSelectedRoom: any,
  setIsAuthenticated: any,
  selectedRoom: number | null,
) => (
  <div className="min-h-screen bg-gray-50">
    {/* Header */}
    <div className="bg-blue-500 text-white p-3 flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold">ACS</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-blue-600 p-1"
          onClick={() => setCurrentView("home")}
        >
          <Home className="w-5 h-5" />
        </Button>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-base">コンシェルジュ様</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-blue-600 px-2 py-1 text-sm"
          onClick={() => {
            setIsAuthenticated(false)
            setCurrentView("home")
          }}
        >
          ログアウト
        </Button>
      </div>
    </div>

    {/* Main Content */}
    <div className="p-3">
      <h1 className="text-xl font-bold text-center mb-4 text-gray-800">ホーム</h1>

      {/* Room List */}
      <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
        {roomAssignments.map((assignment, index) => (
          <Button
            key={index}
            variant="outline"
            className={`w-full p-3 h-auto border-blue-300 hover:bg-blue-200 text-left ${
              selectedRoom === index ? "bg-blue-200 border-blue-500 border-2" : "bg-blue-100"
            }`}
            onClick={() => {
              setSelectedRoom(index)
            }}
          >
            <span className="text-sm font-medium text-gray-800">
              {assignment.roomNumber}号室　{assignment.customer.姓} {assignment.customer.名}様
            </span>
          </Button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="部屋番号 or 氏名　で検索"
            className="w-full p-3 pl-10 bg-gray-200 border border-gray-300 rounded-lg text-sm"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border border-gray-400 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            disabled={selectedRoom === null}
            className={`p-4 h-auto text-center ${
              selectedRoom === null
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gray-600 text-white hover:bg-blue-500"
            }`}
            onClick={() => selectedRoom !== null && setCurrentView("dashboard")}
          >
            <span className="text-sm font-medium">ダッシュボード</span>
          </Button>
          <Button
            variant="outline"
            disabled={selectedRoom === null}
            className={`p-4 h-auto text-center ${
              selectedRoom === null
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gray-600 text-white hover:bg-blue-500"
            }`}
            onClick={() => selectedRoom !== null && setCurrentView("arrangements")}
          >
            <span className="text-sm font-medium">手配・予約</span>
          </Button>
        </div>
        <Button
          variant="outline"
          disabled={selectedRoom === null}
          className={`w-full p-4 h-auto text-center ${
            selectedRoom === null
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gray-600 text-white hover:bg-blue-500"
          }`}
          onClick={() => selectedRoom !== null && setCurrentView("ai-recommend")}
        >
          <span className="text-sm font-medium">AIレコメンド</span>
        </Button>
      </div>
    </div>

    {/* Bottom Navigation */}
    {renderBottomNavigation("home", setCurrentView)}
  </div>
)

const renderAIRecommend = (setCurrentView: any, roomAssignments: RoomAssignment[], selectedRoom: number | null) => {
  const selectedCustomer = selectedRoom !== null ? roomAssignments[selectedRoom] : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-500 text-white p-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-blue-600 p-1.5"
          onClick={() => setCurrentView("home")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">ACS</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-600 p-1"
            onClick={() => setCurrentView("home")}
          >
            <Home className="w-5 h-5" />
          </Button>
        </div>
        <div className="ml-auto">
          <span className="text-base">コンシェルジュ様</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3">
        <h1 className="text-xl font-bold text-center mb-4 text-gray-800">AIレコメンド</h1>

        {selectedCustomer && (
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-4 text-center">
            <span className="text-sm font-medium text-gray-800">
              {selectedCustomer.roomNumber}号室　{selectedCustomer.customer.姓} {selectedCustomer.customer.名}
              様へのおすすめ
            </span>
          </div>
        )}

        <div className="space-y-4 mb-16">
          {/* Top row - Spots and Restaurants */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="p-0 h-auto bg-white border-gray-300 hover:bg-gray-50 overflow-hidden"
              onClick={() => setCurrentView("spots")}
            >
              <div className="w-full">
                <div className="text-center py-2 text-sm font-medium text-gray-800 border-b">スポット</div>
                <div className="h-20 bg-gray-100 flex items-center justify-center">
                  <img
                    src="/resort-pool-ocean-view.png"
                    alt="Resort pool with ocean view"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="p-0 h-auto bg-white border-gray-300 hover:bg-gray-50 overflow-hidden"
              onClick={() => setCurrentView("restaurants")}
            >
              <div className="w-full">
                <div className="text-center py-2 text-sm font-medium text-gray-800 border-b">レストラン</div>
                <div className="h-20 bg-gray-100 flex items-center justify-center">
                  <img
                    src="/elegant-hotel-restaurant.png"
                    alt="Elegant hotel restaurant"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </Button>
          </div>

          {/* Bottom row - Souvenirs and Activities */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="p-0 h-auto bg-white border-gray-300 hover:bg-gray-50 overflow-hidden"
              onClick={() => setCurrentView("souvenirs")}
            >
              <div className="w-full">
                <div className="text-center py-2 text-sm font-medium text-gray-800 border-b">お土産</div>
                <div className="h-20 bg-gray-100 flex items-center justify-center">
                  <img
                    src="/purple-sweet-potato-wagashi.png"
                    alt="Purple sweet potato wagashi"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="p-0 h-auto bg-white border-gray-300 hover:bg-gray-50 overflow-hidden"
              onClick={() => setCurrentView("activities")}
            >
              <div className="w-full">
                <div className="text-center py-2 text-sm font-medium text-gray-800 border-b">アクティビティ</div>
                <div className="h-20 bg-gray-100 flex items-center justify-center">
                  <img
                    src="/tropical-water-sports.png"
                    alt="Tropical water sports"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </Button>
          </div>

          {/* Travel Plans - Full width */}
          <Button
            variant="outline"
            className="w-full p-0 h-auto bg-white border-gray-300 hover:bg-gray-50 overflow-hidden"
            onClick={() => {
              if (selectedCustomer) {
                const payload = {
                  id: selectedCustomer.customer.顧客ID || `C-${selectedCustomer.roomNumber}`,
                  displayName: `${selectedCustomer.customer.姓} ${selectedCustomer.customer.名}`,
                  adults: 2,
                  children: 0,
                  seniors: 0,
                  stroller: false,
                  wheelchair: false,
                }
                const q = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
                // モバイル対応: 端末から見える同一ホストIPに合わせる
                const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
                const url = `http://${host}:5173/?customer=${q}&return=http://${host}:3000`
                window.location.href = url
              }
            }}
          >
            <div className="w-full">
              <div className="text-center py-2 text-sm font-medium text-gray-800 border-b">旅行プラン</div>
              <div className="h-24 bg-gray-100 flex items-center justify-center">
                <img src="/tropical-resort.png" alt="Tropical resort" className="w-full h-full object-cover" />
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      {renderBottomNavigation("ai-recommend", setCurrentView)}
    </div>
  )
}

const renderDashboard = (setCurrentView: any, roomAssignments: RoomAssignment[], selectedRoom: number | null) => {
  const selectedCustomer = selectedRoom !== null ? roomAssignments[selectedRoom] : null

  if (!selectedCustomer) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-blue-500 text-white p-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-600 p-1.5"
            onClick={() => setCurrentView("home")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">ACS</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-600 p-1"
              onClick={() => setCurrentView("home")}
            >
              <Home className="w-5 h-5" />
            </Button>
          </div>
          <div className="ml-auto">
            <span className="text-base">コンシェルジュ様</span>
          </div>
        </div>
        <div className="p-3">
          <h1 className="text-xl font-bold text-center mb-4 text-gray-800">ダッシュボード</h1>
          <div className="text-center text-gray-500">顧客が選択されていません</div>
        </div>
        {/* Bottom Navigation */}
        {renderBottomNavigation("dashboard", setCurrentView)}
      </div>
    )
  }

  const customer = selectedCustomer?.customer

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-500 text-white p-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-blue-600 p-1.5"
          onClick={() => setCurrentView("home")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">ACS</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-600 p-1"
            onClick={() => setCurrentView("home")}
          >
            <Home className="w-5 h-5" />
          </Button>
        </div>
        <div className="ml-auto">
          <span className="text-base">コンシェルジュ様</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3">
        <h1 className="text-xl font-bold text-center mb-4 text-gray-800">ダッシュボード</h1>

        {/* Customer Info Banner */}
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-4 text-center">
          <span className="text-sm font-medium text-gray-800">
            {selectedCustomer.roomNumber}号室　{selectedCustomer.customer.姓} {selectedCustomer.customer.名}様
          </span>
        </div>

        {/* Customer Details Table */}
        <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
          <table className="w-full">
            <tbody>
              <tr className="border-b">
                <td className="p-3 bg-gray-50 font-medium text-sm">注意</td>
                <td className="p-3 text-sm">
                  <div className="flex gap-2">
                    <span className="text-pink-500 text-lg">♀</span>
                    <span className="text-gray-800 text-lg">👶</span>
                  </div>
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-3 bg-gray-50 font-medium text-sm">年齢/性別</td>
                <td className="p-3 text-sm">
                  {customer?.年齢}歳/{customer?.["性別コード値"] === "1" ? "男性" : "女性"}
                </td>
              </tr>
              <tr>
                <td className="p-3 bg-gray-50 font-medium text-sm">同行者</td>
                <td className="p-3 text-sm">
                  {parseCompanionInfo(customer?.同行者情報).map((companion: any, index: number) => (
                    <span key={index}>
                      {companion.age}歳/{companion.gender || "女性"}
                      {index < parseCompanionInfo(customer?.同行者情報).length - 1 ? "、" : ""}
                    </span>
                  ))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Special Notes */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">特記事項:</h3>
          <div className="bg-gray-100 p-3 rounded text-sm text-gray-600 min-h-[60px]">
            {customer?.特記事項 || "特になし"}
          </div>
        </div>

        {/* Response History */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">対応履歴:</h3>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left font-medium">日時</th>
                  <th className="p-2 text-left font-medium">種類</th>
                  <th className="p-2 text-left font-medium">詳細</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">2025/08/19 10:34</td>
                  <td className="p-2">備品不足</td>
                  <td className="p-2">歯ブラシ</td>
                </tr>
                <tr>
                  <td className="p-2">2025/08/19 11:55</td>
                  <td className="p-2">旅行プラン</td>
                  <td className="p-2">プランB</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Language Used */}
        <div className="mb-16">
          <h3 className="text-sm font-medium text-gray-700 mb-2">使用言語:</h3>
          <div className="bg-gray-100 p-3 rounded text-sm text-gray-600 min-h-[40px]">
            {customer?.使用言語 === "JA" ? "日本語" : customer?.使用言語 || "日本語"}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      {renderBottomNavigation("dashboard", setCurrentView)}
    </div>
  )
}

const renderArrangements = (setCurrentView: any, roomAssignments: RoomAssignment[], selectedRoom: number | null) => {
  const selectedCustomer = selectedRoom !== null ? roomAssignments[selectedRoom] : null

  if (!selectedCustomer) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-blue-500 text-white p-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-600 p-1.5"
            onClick={() => setCurrentView("home")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">ACS</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-600 p-1"
              onClick={() => setCurrentView("home")}
            >
              <Home className="w-5 h-5" />
            </Button>
          </div>
          <div className="ml-auto">
            <span className="text-base">コンシェルジュ様</span>
          </div>
        </div>
        <div className="p-3">
          <h1 className="text-xl font-bold text-center mb-4 text-gray-800">予約・手配</h1>
          <div className="text-center text-gray-500">顧客が選択されていません</div>
        </div>
        {/* Bottom Navigation */}
        {renderBottomNavigation("arrangements", setCurrentView)}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-500 text-white p-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-blue-600 p-1.5"
          onClick={() => setCurrentView("home")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">ACS</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-600 p-1"
            onClick={() => setCurrentView("home")}
          >
            <Home className="w-5 h-5" />
          </Button>
        </div>
        <div className="ml-auto">
          <span className="text-base">コンシェルジュ様</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3">
        <h1 className="text-xl font-bold text-center mb-4 text-gray-800">予約・手配</h1>

        {/* Customer Info Banner */}
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-4 text-center">
          <span className="text-sm font-medium text-gray-800">
            {selectedCustomer.roomNumber}号室　{selectedCustomer.customer.姓} {selectedCustomer.customer.名}様
          </span>
        </div>

        {/* Service Categories Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <div className="p-4 text-center">
              <div className="text-blue-500 text-2xl mb-2">🚗</div>
              <span className="text-sm font-medium">タクシー</span>
            </div>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <div className="p-4 text-center">
              <div className="text-gray-800 text-2xl mb-2">🚙</div>
              <span className="text-sm font-medium">レンタカー</span>
            </div>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <div className="p-4 text-center">
              <div className="text-orange-500 text-2xl mb-2">🍽️</div>
              <span className="text-sm font-medium">レストラン・カフェ</span>
            </div>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <div className="p-4 text-center">
              <div className="text-green-500 text-2xl mb-2">👣</div>
              <span className="text-sm font-medium">アクティビティ</span>
            </div>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <div className="p-4 text-center">
              <div className="text-purple-500 text-2xl mb-2">🛍️</div>
              <span className="text-sm font-medium">お土産</span>
            </div>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <div className="p-4 text-center">
              <div className="text-red-500 text-2xl mb-2">🏥</div>
              <span className="text-sm font-medium">病院</span>
            </div>
          </Card>
        </div>

        {/* Details Input */}
        <div className="mb-16">
          <h3 className="text-sm font-medium text-gray-700 mb-2">選択したご依頼の詳細を入力</h3>
          <textarea
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none text-sm"
            placeholder="詳細をご入力ください..."
          />
        </div>
      </div>

      {/* Bottom Navigation */}
      {renderBottomNavigation("arrangements", setCurrentView)}
    </div>
  )
}

const renderGuestDetail = (setCurrentView: any, roomAssignments: any) => {
  const selectedCustomer = roomAssignments.find(
    (assignment: any) => assignment.roomNumber === roomAssignments[0]?.roomNumber,
  )
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-500 text-white p-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-blue-600 p-1.5"
          onClick={() => setCurrentView("home")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">ACS</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-600 p-1"
            onClick={() => setCurrentView("home")}
          >
            <Home className="w-5 h-5" />
          </Button>
        </div>
        <div className="ml-auto">
          <span className="text-base">コンシェルジュ様</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3">
        <h1 className="text-xl font-bold text-center mb-4 text-gray-800">ゲスト詳細</h1>
        {selectedCustomer && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-800">顧客ID: {selectedCustomer.顧客ID}</div>
              <div className="text-sm font-medium text-gray-800">
                氏名: {selectedCustomer.姓} {selectedCustomer.名}
              </div>
              <div className="text-sm font-medium text-gray-800">年齢: {selectedCustomer.年齢}</div>
              <div className="text-sm font-medium text-gray-800">性別コード値: {selectedCustomer.性別コード値}</div>
              <div className="text-sm font-medium text-gray-800">同行者情報: {selectedCustomer.同行者情報}</div>
              <div className="text-sm font-medium text-gray-800">特記事項: {selectedCustomer.特記事項}</div>
              <div className="text-sm font-medium text-gray-800">使用言語: {selectedCustomer.使用言語}</div>
              <div className="text-sm font-medium text-gray-800">電話番号: {selectedCustomer.電話番号}</div>
              <div className="text-sm font-medium text-gray-800">メールアドレス: {selectedCustomer.メールアドレス}</div>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      {renderBottomNavigation("guest-detail", setCurrentView)}
    </div>
  )
}

const renderCategoryDetail = (setCurrentView: any, category: Category, categories: any) => {
  const categoryDetail = categories.find((cat: any) => cat.id === category)
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-500 text-white p-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-blue-600 p-1.5"
          onClick={() => setCurrentView("home")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">ACS</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-600 p-1"
            onClick={() => setCurrentView("home")}
          >
            <Home className="w-5 h-5" />
          </Button>
        </div>
        <div className="ml-auto">
          <span className="text-base">コンシェルジュ様</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3">
        <h1 className="text-xl font-bold text-center mb-4 text-gray-800">{categoryDetail?.title}</h1>
        <p className="text-gray-600 text-center mb-4">{categoryDetail?.description}</p>
        {/* Placeholder for category detail content */}
      </div>

      {/* Bottom Navigation */}
      {renderBottomNavigation(category, setCurrentView)}
    </div>
  )
}

const renderHotelMap = (setCurrentView: any) => (
  <div className="min-h-screen bg-gray-50">
    {/* Header */}
    <div className="bg-blue-500 text-white p-3 flex items-center gap-3">
      <Button
        variant="ghost"
        size="sm"
        className="text-white hover:bg-blue-600 p-1.5"
        onClick={() => setCurrentView("home")}
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold">ACS</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-blue-600 p-1"
          onClick={() => setCurrentView("home")}
        >
          <Home className="w-5 h-5" />
        </Button>
      </div>
      <div className="ml-auto">
        <span className="text-base">コンシェルジュ様</span>
      </div>
    </div>

    {/* Main Content */}
    <div className="p-3">
      <h1 className="text-xl font-bold text-center mb-4 text-gray-800">館内マップ</h1>

      {/* Map Content */}
      <div className="space-y-4 mb-16">
        {/* Upper Floor Plan */}
        <Card className="p-4">
          <div className="relative bg-gray-100 rounded-lg p-4 min-h-48">
            {/* North indicator */}
            <div className="absolute top-2 right-2 text-xs font-bold">N ↑</div>

            {/* Hotel buildings */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-gray-300 border-2 border-gray-400 rounded p-2 text-center text-xs">ホテル本館</div>
              <div className="bg-gray-300 border-2 border-gray-400 rounded p-2 text-center text-xs">客室棟A</div>
              <div className="bg-gray-300 border-2 border-gray-400 rounded p-2 text-center text-xs">客室棟B</div>
            </div>

            {/* Garden and facilities */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-green-200 border-2 border-green-400 rounded p-2 text-center text-xs">庭園</div>
              <div className="bg-green-200 border-2 border-green-400 rounded p-2 text-center text-xs">庭園</div>
              <div className="bg-white border-2 border-gray-400 rounded p-1 text-center">
                <div className="text-xs mb-1">♿ ♨</div>
                <div className="text-xs">🚗 🗺</div>
              </div>
            </div>

            {/* Bus stop */}
            <div className="mt-2">
              <div className="bg-yellow-200 border-2 border-yellow-400 rounded p-2 text-center text-xs inline-block">
                🚌 送迎バス乗場
              </div>
            </div>
          </div>
        </Card>

        {/* Lower Floor Plan */}
        <Card className="p-4">
          <div className="relative bg-gray-100 rounded-lg p-4 min-h-64">
            {/* Main facilities layout */}
            <div className="grid grid-cols-4 gap-1 mb-2 text-xs">
              <div className="bg-gray-300 border border-gray-400 rounded p-1 text-center">ロビー・フロント</div>
              <div className="bg-gray-300 border border-gray-400 rounded p-1 text-center">エレベーター</div>
              <div className="bg-gray-300 border border-gray-400 rounded p-1 text-center">ショップ</div>
              <div className="bg-gray-300 border border-gray-400 rounded p-1 text-center">会議室</div>
            </div>

            <div className="grid grid-cols-4 gap-1 mb-2 text-xs">
              <div className="bg-gray-300 border border-gray-400 rounded p-1 text-center">フィットネス</div>
              <div className="bg-gray-300 border border-gray-400 rounded p-1 text-center">フィットルーム</div>
              <div className="bg-gray-300 border border-gray-400 rounded p-1 text-center">フィットネス/スパ</div>
              <div className="bg-gray-300 border border-gray-400 rounded p-1 text-center">トイレ</div>
            </div>

            {/* Large bath area */}
            <div className="bg-blue-200 border-2 border-blue-400 rounded p-2 text-center">
              <div className="font-bold text-sm mb-1">♨ 大浴場(温泉)</div>
              <div className="grid grid-cols-3 gap-1 text-xs">
                <div className="bg-blue-100 rounded p-1">売店</div>
                <div className="bg-blue-100 rounded p-1">天窓</div>
                <div className="bg-blue-100 rounded p-1">回天</div>
              </div>
              <div className="bg-blue-100 rounded p-1 mt-1 text-xs">サウナ</div>
            </div>

            {/* Scale indicator */}
            <div className="absolute bottom-2 right-2 text-xs">
              <div className="border-b border-black w-8 mb-1"></div>
              <div>0.15m</div>
            </div>
          </div>
        </Card>
      </div>
    </div>

    {/* Bottom Navigation */}
    {renderBottomNavigation("hotel-map", setCurrentView)}
  </div>
)

const renderRequestQueue = (setCurrentView: any, setSelectedCustomer: any, requestQueue: any[]) => {
  const handleCustomerClick = (customer: any) => {
    setSelectedCustomer(customer)
    setCurrentView("dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-500 text-white p-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-blue-600 p-1.5"
          onClick={() => setCurrentView("home")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">ACS</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-600 p-1"
            onClick={() => setCurrentView("home")}
          >
            <Home className="w-5 h-5" />
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Filter className="w-4 h-4 text-yellow-300" />
          <span className="text-base">コンシェルジュ様</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3">
        <h1 className="text-xl font-bold text-center mb-4 text-gray-800">ご依頼キュー</h1>
        <h2 className="text-lg font-medium text-center mb-4 text-gray-700">お客様情報</h2>

        <Card className="mb-16">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b bg-gray-50">
                  <th className="p-2 text-left font-medium">顧客ID</th>
                  <th className="p-2 text-left font-medium border-l">氏名</th>
                  <th className="p-2 text-left font-medium border-l">ご依頼受付日時</th>
                  <th className="p-2 text-center font-medium border-l">ご依頼</th>
                </tr>
              </thead>
              <tbody>
                {requestQueue.map((request, index) => {
                  const ServiceIcon = request.service.icon
                  return (
                    <tr key={request.id} className={`border-b ${index % 2 === 1 ? "bg-yellow-50" : ""}`}>
                      <td className="p-2">{request.customerId}</td>
                      <td className="p-2 border-l">
                        <button
                          onClick={() => handleCustomerClick(request.customer)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {request.customerName}様
                        </button>
                      </td>
                      <td className="p-2 border-l">{request.requestTime}</td>
                      <td className="p-2 border-l text-center">
                        <ServiceIcon className={`w-4 h-4 mx-auto ${request.service.color}`} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Bottom Navigation */}
      {renderBottomNavigation("request-queue", setCurrentView)}
    </div>
  )
}

const renderCongestion = (setCurrentView: any, activeTab: string, setActiveTab: any) => {
  const tabs = ["ランドリー", "銭湯", "レストラン"]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-500 text-white p-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-blue-600 p-1.5"
          onClick={() => setCurrentView("home")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">ACS</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-600 p-1"
            onClick={() => setCurrentView("home")}
          >
            <Home className="w-5 h-5" />
          </Button>
        </div>
        <div className="ml-auto">
          <span className="text-base">コンシェルジュ様</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3">
        <h1 className="text-xl font-bold text-center mb-4 text-gray-800">混雑状況</h1>

        {/* Tabs */}
        <div className="flex mb-4">
          {tabs.map((tab: any) => (
            <button
              key={tab}
              className={`flex-1 py-2 px-3 text-sm font-medium border-b-2 ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600 bg-white"
                  : "border-gray-300 text-gray-600 bg-gray-100"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Floor Plan with Congestion */}
        <Card className="p-4 mb-16">
          <div className="relative bg-gray-100 rounded-lg p-4 min-h-80">
            {/* Floor plan layout */}
            <div className="absolute inset-4 border-2 border-black rounded">
              {/* Room divisions */}
              <div className="absolute top-0 left-1/3 w-px h-full bg-black"></div>
              <div className="absolute top-1/2 left-0 w-full h-px bg-black"></div>
              <div className="absolute top-1/4 right-0 w-1/3 h-px bg-black"></div>

              {/* People indicators and location markers */}
              {/* Top left area */}
              <div className="absolute top-4 left-4">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                  📍
                </div>
                <div className="text-red-500 text-lg mt-1">👤</div>
              </div>

              {/* Top center area */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                  📍
                </div>
                <div className="text-red-500 text-sm mt-1">👥👥👥👥</div>
              </div>

              {/* Center area */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                  📍
                </div>
                <div className="text-red-500 text-sm mt-1">👥👥👥👥👥👥</div>
              </div>

              {/* Top right area */}
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                  📍
                </div>
                <div className="text-red-500 text-sm mt-1">👥👥👥👥</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Navigation */}
      {renderBottomNavigation("congestion", setCurrentView)}
    </div>
  )
}

const renderMessages = (setCurrentView: any) => (
  <div className="min-h-screen bg-gray-50">
    {/* Header */}
    <div className="bg-blue-500 text-white p-3 flex items-center gap-3">
      <Button
        variant="ghost"
        size="sm"
        className="text-white hover:bg-blue-600 p-1.5"
        onClick={() => setCurrentView("home")}
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold">ACS</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-blue-600 p-1"
          onClick={() => setCurrentView("home")}
        >
          <Home className="w-5 h-5" />
        </Button>
      </div>
      <div className="ml-auto">
        <span className="text-base">コンシェルジュ様</span>
      </div>
    </div>

    {/* Main Content */}
    <div className="p-3">
      <h1 className="text-xl font-bold text-center mb-4 text-gray-800">メッセージ</h1>

      {/* Message List */}
      <div className="space-y-3 mb-16">
        {customerData.slice(0, 6).map((customerEntry: any, index: number) => (
          <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
            <div className="p-3 flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-800 mb-1">
                  {customerEntry.customer.姓} {customerEntry.customer.名}さん
                </div>
                <div className="text-gray-600 text-sm">メッセージ</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>

    {/* Bottom Navigation */}
    {renderBottomNavigation("messages", setCurrentView)}
  </div>
)

const renderBottomNavigation = (activeScreen: string, setCurrentView: any) => (
  <div className="fixed bottom-0 left-0 right-0 bg-blue-500 text-white">
    <div className="flex justify-around py-2">
      <Button
        variant="ghost"
        size="sm"
        className={`text-white hover:bg-blue-600 p-2 ${activeScreen === "request-queue" ? "bg-blue-600" : ""}`}
        onClick={() => setCurrentView("request-queue")}
      >
        <Users className="w-5 h-5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`text-white hover:bg-blue-600 p-2 ${activeScreen === "messages" ? "bg-blue-600" : ""}`}
        onClick={() => setCurrentView("messages")}
      >
        <MessageCircle className="w-5 h-5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`text-white hover:bg-blue-600 p-2 ${activeScreen === "congestion" ? "bg-blue-600" : ""}`}
        onClick={() => setCurrentView("congestion")}
      >
        <Users className="w-5 h-5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`text-white hover:bg-blue-600 p-2 ${activeScreen === "hotel-map" ? "bg-blue-600" : ""}`}
        onClick={() => setCurrentView("hotel-map")}
      >
        <Map className="w-5 h-5" />
      </Button>
    </div>
  </div>
)

const renderLogin = (
  onLogin: any,
  loginError: string,
  username: string,
  setUsername: any,
  password: string,
  setPassword: any,
) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(username, password)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Blue header */}
      <div className="bg-blue-500 h-16"></div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Hotel branding */}
        <div className="bg-blue-500 text-white px-8 py-6 rounded-lg mb-8 text-center">
          <h1 className="text-xl font-bold mb-2">WAKON HOTEL</h1>
          <p className="text-sm">Advanced Concierge System</p>
        </div>

        {/* Concierge button */}
        <Button
          variant="outline"
          className="mb-8 px-6 py-2 border-blue-500 text-blue-500 hover:bg-blue-50 bg-transparent"
        >
          コンシェルジュ向け
        </Button>

        {/* Login form */}
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">ログイン</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">従業員ID</label>
              <Input
                type="text"
                placeholder="従業員ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
              <Input
                type="password"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                required
              />
            </div>

            {loginError && <div className="text-red-500 text-sm text-center">{loginError}</div>}

            <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md">
              ログイン
            </Button>
          </form>

          <div className="text-center mt-4">
            <a href="#" className="text-blue-500 text-sm hover:underline">
              パスワードをお忘れですか？
            </a>
          </div>
        </div>
      </div>

      {/* Blue footer */}
      <div className="bg-blue-500 h-16"></div>
    </div>
  )
}

const getSelectedCustomer = () => {
  // Placeholder function to get selected customer
  return {
    roomNumber: "101",
    customer: {
      姓: "田中",
      名: "太郎",
      年齢: "30",
      性別コード値: "1",
      同行者情報: "",
      特記事項: "",
      使用言語: "JA",
      電話番号: "123-456-7890",
      メールアドレス: "tanaka@example.com",
    },
  }
}

const parseCompanionInfo = (info: string) => {
  // Placeholder function to parse companion info
  return [{ age: "10", gender: "男性" }]
}

const customerData = [
  {
    customer: {
      姓: "田中",
      名: "太郎",
      年齢: "30",
      性別コード値: "1",
      同行者情報: "",
      特記事項: "",
      使用言語: "JA",
      電話番号: "123-456-7890",
      メールアドレス: "tanaka@example.com",
    },
  },
  {
    customer: {
      姓: "佐藤",
      名: "花子",
      年齢: "25",
      性別コード値: "2",
      同行者情報: "",
      特記事項: "",
      使用言語: "EN",
      電話番号: "098-765-4321",
      メールアドレス: "satou@example.com",
    },
  },
  // Additional customer data entries
]

export default function HotelRecommendApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const [currentView, setCurrentView] = useState<View>("home")
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("ランドリー")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [roomAssignments, setRoomAssignments] = useState<RoomAssignment[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [requestQueueCustomers, setRequestQueueCustomers] = useState<Customer[]>([])

  const categories = [
    {
      id: "spots" as Category,
      title: "スポット",
      image: "/resort-pool-ocean-view.png",
      description: "周辺の観光スポットをご紹介",
    },
    {
      id: "restaurants" as Category,
      title: "レストラン",
      image: "/elegant-hotel-restaurant.png",
      description: "おすすめのレストラン情報",
    },
    {
      id: "souvenirs" as Category,
      title: "お土産",
      image: "/purple-sweet-potato-wagashi.png",
      description: "地元の特産品・お土産",
    },
    {
      id: "activities" as Category,
      title: "アクティビティ",
      image: "/tropical-water-sports.png",
      description: "体験できるアクティビティ",
    },
    {
      id: "travel-plans" as Category,
      title: "旅行プラン",
      image: "/tropical-resort.png",
      description: "おすすめの旅行プラン",
    },
  ]

  const fetchCustomerData = async () => {
    try {
      // backend(Flask 5001) の顧客APIを参照（モバイル対応: 同一ホストIPに自動バインド）
      const apiBase =
        (process.env.NEXT_PUBLIC_BACKEND_BASE as string) ||
        (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5001` : 'http://localhost:5001')
      const res = await fetch(`${apiBase}/api/customers`)
      if (!res.ok) throw new Error('customer api error')
      const data = await res.json()
      const customerData: Customer[] = data.customers || []

      setCustomers(customerData)
      setRequestQueueCustomers(customerData)

      const assignments: RoomAssignment[] = []
      const roomNumbers = ["101", "102", "103", "104", "105", "106", "107", "108"]
      const shuffledCustomers = [...customerData].sort(() => Math.random() - 0.5)

      for (let i = 0; i < Math.min(8, shuffledCustomers.length); i++) {
        assignments.push({
          roomNumber: roomNumbers[i],
          customer: shuffledCustomers[i],
        })
      }

      setRoomAssignments(assignments)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching customer data:", error)
      setLoading(false)
    }
  }

  const handleLogin = (username: string, password: string) => {
    if (username === "test" && password === "test") {
      setIsAuthenticated(true)
      setLoginError("")
      try { sessionStorage.setItem('hotel_is_auth', '1') } catch {}
    } else {
      setLoginError("従業員IDまたはパスワードが正しくありません")
    }
  }

  useEffect(() => {
    // セッション維持: ログイン状態を復元
    try {
      const flag = sessionStorage.getItem('hotel_is_auth')
      if (flag === '1') setIsAuthenticated(true)
    } catch {}
    fetchCustomerData()
  }, [])

  const generateRequestQueue = () => {
    if (!requestQueueCustomers || requestQueueCustomers.length === 0) return []

    const serviceTypes = [
      { icon: ShoppingBag, color: "text-purple-500", name: "お土産" },
      { icon: Utensils, color: "text-orange-500", name: "レストラン" },
      { icon: Footprints, color: "text-green-500", name: "アクティビティ" },
      { icon: Cross, color: "text-red-500", name: "病院" },
      { icon: Car, color: "text-black", name: "レンタカー" },
      { icon: Car, color: "text-blue-500", name: "タクシー" },
    ]

    const requests = []
    const today = new Date()

    // Generate 15-20 requests from random customers
    for (let i = 0; i < 18; i++) {
      const customer = requestQueueCustomers[Math.floor(Math.random() * requestQueueCustomers.length)]
      const service = serviceTypes[Math.floor(Math.random() * serviceTypes.length)]
      const requestTime = new Date(today.getTime() - Math.random() * 24 * 60 * 60 * 1000) // Random time in last 24 hours

      requests.push({
        id: `R${String(i + 100).padStart(3, "0")}`,
        customerId: customer.顧客ID,
        customerName: `${customer.姓} ${customer.名}`,
        requestTime: requestTime
          .toLocaleString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
          .replace(/\//g, "/"),
        service: service,
        customer: customer,
      })
    }

    // Sort by request time (newest first)
    return requests.sort((a, b) => new Date(b.requestTime).getTime() - new Date(a.requestTime).getTime())
  }

  if (!isAuthenticated) {
    return renderLogin(handleLogin, loginError, username, setUsername, password, setPassword)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-600 mb-2">データを読み込み中...</div>
          <div className="text-sm text-gray-500">顧客情報を取得しています</div>
        </div>
      </div>
    )
  }

  switch (currentView) {
    case "home":
      return renderHome(setCurrentView, roomAssignments, setSelectedRoom, setIsAuthenticated, selectedRoom)
    case "ai-recommend":
      return renderAIRecommend(setCurrentView, roomAssignments, selectedRoom)
    case "dashboard":
      return renderDashboard(setCurrentView, roomAssignments, selectedRoom)
    case "arrangements":
      return renderArrangements(setCurrentView, roomAssignments, selectedRoom)
    case "guest-detail":
      return renderGuestDetail(setCurrentView, roomAssignments)
    case "spots":
      return renderCategoryDetail(setCurrentView, "spots", categories)
    case "restaurants":
      return renderCategoryDetail(setCurrentView, "restaurants", categories)
    case "souvenirs":
      return renderCategoryDetail(setCurrentView, "souvenirs", categories)
    case "activities":
      return renderCategoryDetail(setCurrentView, "activities", categories)
    case "travel-plans":
      return renderCategoryDetail(setCurrentView, "travel-plans", categories)
    case "request-queue":
      return renderRequestQueue(setCurrentView, setSelectedCustomer, generateRequestQueue())
    case "messages":
      return renderMessages(setCurrentView)
    case "congestion":
      return renderCongestion(setCurrentView, activeTab, setActiveTab)
    case "hotel-map":
      return renderHotelMap(setCurrentView)
    default:
      return renderHome(setCurrentView, roomAssignments, setSelectedRoom, setIsAuthenticated, selectedRoom)
  }
}
