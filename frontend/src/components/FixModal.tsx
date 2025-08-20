import React from 'react'

type Props = { onClose: () => void; onApply: () => void }

export const FixModal: React.FC<Props> = ({ onClose, onApply }) => {
  return (
    <div className="modal">
      <div className="modal__content">
        <h3>整える提案</h3>
        <div className="grid">
          <div className="card">+15分</div>
          <div className="card">近場へ差替</div>
          <div className="card">滞在-10分</div>
        </div>
        <div className="modal__actions">
          <button onClick={onApply}>適用</button>
          <button onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  )
}



