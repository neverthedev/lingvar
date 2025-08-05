import React from 'react'
import { Typography, Button, Icon } from '../atoms'

interface CaseColumn {
  key: string
  name: string
}

interface TableData {
  id: number
  word: string
  [key: string]: any
}

interface CellState {
  isEditing?: boolean
  isCorrect?: boolean
  showAnswer?: boolean
  answer?: string
}

interface InteractiveLessonTableProps {
  data: TableData[]
  cases: CaseColumn[]
  cellStates: Record<string, CellState>
  inputValues: Record<string, string>
  attempts: Record<string, number>
  onCellClick: (id: number, caseKey: string) => void
  onInputChange: (id: number, caseKey: string, value: string) => void
  onOk: (item: TableData, caseKey: string) => void
  onCancel: (id: number, caseKey: string) => void
  title?: string
  description?: string
}

export const InteractiveLessonTable: React.FC<InteractiveLessonTableProps> = ({
  data,
  cases,
  cellStates,
  inputValues,
  attempts,
  onCellClick,
  onInputChange,
  onOk,
  onCancel,
  title = "Interactive Exercise",
  description = "Click on any case cell to fill in the correct form. You have 3 attempts per cell."
}) => {
  const getCellContent = (item: TableData, caseKey: string) => {
    const cellKey = `${item.id}-${caseKey}`
    const cellState = cellStates[cellKey]
    const inputValue = inputValues[cellKey] || ''
    const attemptCount = attempts[cellKey] || 0

    if (cellState?.isEditing) {
      return (
        <div className="flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(item.id, caseKey, e.target.value)}
            className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mr-1"
            placeholder="Enter word..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onOk(item, caseKey)
              } else if (e.key === 'Escape') {
                onCancel(item.id, caseKey)
              }
            }}
            autoFocus
          />
          <div className="flex ml-1">
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onOk(item, caseKey)
              }}
              variant="ghost"
              size="sm"
              className="p-0.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
              title="OK"
            >
              <Icon name="check" size="sm" />
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onCancel(item.id, caseKey)
              }}
              variant="ghost"
              size="sm"
              className="p-0.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded ml-0.5"
              title="Cancel"
            >
              <Icon name="close" size="sm" />
            </Button>
          </div>
          {attemptCount > 0 && (
            <div className="text-xs text-red-500 ml-2">
              {attemptCount}/3
            </div>
          )}
        </div>
      )
    }

    if (cellState?.showAnswer) {
      return (
        <span className="font-medium">
          {cellState.answer}
        </span>
      )
    }

    return (
      <div className="text-center">
        <span className="text-gray-400">Click to fill</span>
      </div>
    )
  }

  const getCellClass = (item: TableData, caseKey: string) => {
    const cellKey = `${item.id}-${caseKey}`
    const cellState = cellStates[cellKey]

    if (cellState?.showAnswer) {
      if (cellState.isCorrect) {
        return "p-3 border-2 border-green-500 bg-green-50 transition-colors"
      } else {
        return "p-3 border-2 border-red-500 bg-red-50 transition-colors"
      }
    }

    return "p-3 border cursor-pointer hover:bg-gray-50 transition-colors"
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b bg-gray-50">
        <Typography variant="h3" className="text-lg font-semibold text-gray-900">{title}</Typography>
        <Typography variant="body" className="text-sm text-gray-600 mt-1">
          {description}
        </Typography>
      </div>

      <div className="relative">
        <table className="w-full">
          {/* Fixed Header */}
          <thead className="bg-gray-50 sticky top-0 z-50 shadow-sm">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-50 border-r min-w-[120px] shadow-sm">
                Word
              </th>
              {cases.map((case_) => (
                <th key={case_.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px] bg-gray-50">
                  {case_.name}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {/* Fixed Word Column */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-inherit z-10 border-r">
                  {item.word}
                </td>

                {/* Case Columns */}
                {cases.map((case_) => (
                  <td
                    key={`${item.id}-${case_.key}`}
                    className={getCellClass(item, case_.key)}
                    onClick={() => onCellClick(item.id, case_.key)}
                  >
                    {getCellContent(item, case_.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
