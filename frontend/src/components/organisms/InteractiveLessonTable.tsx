import React, { useEffect, useState } from 'react'
import { Typography, Button, Icon } from '../atoms'
import { AuthService, API_ENDPOINTS } from '@/lib/api'

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
  title?: string
  description?: string
  wordType?: string
}

export const InteractiveLessonTable: React.FC<InteractiveLessonTableProps> = ({
  data,
  cases,
  title = "Interactive Exercise",
  description = "Click on any case cell to fill in the correct form. You have 3 attempts per cell.",
  wordType
}) => {
  const [cellStates, setCellStates] = useState<Record<string, CellState>>({})
  const [inputValues, setInputValues] = useState<Record<string, string>>({})
  const [attempts, setAttempts] = useState<Record<string, number>>({})
  const [completedWords, setCompletedWords] = useState<Record<number, boolean>>({})
  const [weights, setWeights] = useState<Record<number, number>>({})

  useEffect(() => {
    if (!data || data.length === 0) {
      return
    }
    setWeights(prev => {
      const next = { ...prev }
      data.forEach(item => {
        if (typeof item.weight === 'number' && next[item.id] === undefined) {
          next[item.id] = item.weight
        }
      })
      return next
    })
  }, [data])

  const sendAttempt = async (wordId: number, isCorrect: boolean) => {
    if (!wordType) {
      return
    }
    try {
      const response = await fetch(API_ENDPOINTS.testsAttempt, {
        method: 'POST',
        headers: AuthService.getAuthHeaders(),
        body: JSON.stringify({
          word_type: wordType,
          word_id: wordId,
          is_correct: isCorrect
        })
      })
      if (response.status === 401) {
        AuthService.clearTokens()
      }
    } catch (err) {
      console.error('Failed to send attempt:', err)
    }
  }

  const sendComplete = async (wordId: number, allCorrect: boolean) => {
    if (!wordType) {
      return
    }
    try {
      const response = await fetch(API_ENDPOINTS.testsComplete, {
        method: 'POST',
        headers: AuthService.getAuthHeaders(),
        body: JSON.stringify({
          word_type: wordType,
          word_id: wordId,
          all_correct: allCorrect
        })
      })
      if (response.status === 401) {
        AuthService.clearTokens()
      }
    } catch (err) {
      console.error('Failed to send completion:', err)
    }
  }

  const sendWeight = async (wordId: number, direction: 'up' | 'down') => {
    if (!wordType) {
      return
    }
    try {
      const response = await fetch(API_ENDPOINTS.testsWeight, {
        method: 'POST',
        headers: AuthService.getAuthHeaders(),
        body: JSON.stringify({
          word_type: wordType,
          word_id: wordId,
          direction
        })
      })
      if (response.status === 401) {
        AuthService.clearTokens()
        return
      }
      if (response.ok) {
        const payload = await response.json()
        if (typeof payload?.weight === 'number') {
          setWeights(prev => ({ ...prev, [wordId]: payload.weight }))
        }
      }
    } catch (err) {
      console.error('Failed to send weight update:', err)
    }
  }

  const maybeCompleteWord = (itemId: number, nextStates: Record<string, CellState>) => {
    if (completedWords[itemId]) {
      return
    }
    const allDone = cases.every((case_) => nextStates[`${itemId}-${case_.key}`]?.showAnswer)
    if (!allDone) {
      return
    }
    const allCorrect = cases.every((case_) => nextStates[`${itemId}-${case_.key}`]?.isCorrect)
    setCompletedWords(prev => ({ ...prev, [itemId]: true }))
    void sendComplete(itemId, allCorrect)
  }

  // Handle cell click
  const handleCellClick = (itemId: number, caseKey: string) => {
    const cellKey = `${itemId}-${caseKey}`

    // Don't allow clicking on cells that already have answers
    if (cellStates[cellKey]?.showAnswer) {
      return
    }

    // Cancel all other editing cells first
    setCellStates(prev => {
      const newStates = { ...prev }
      Object.keys(newStates).forEach(key => {
        if (key !== cellKey && newStates[key]?.isEditing) {
          newStates[key] = { ...newStates[key], isEditing: false }
        }
      })
      return newStates
    })

    // Clear input values for other cells
    setInputValues(prev => {
      const newValues = { ...prev }
      Object.keys(newValues).forEach(key => {
        if (key !== cellKey) {
          delete newValues[key]
        }
      })
      return newValues
    })

    // Set the clicked cell to editing mode
    setCellStates(prev => ({
      ...prev,
      [cellKey]: { ...prev[cellKey], isEditing: true }
    }))
  }

  // Handle input change
  const handleInputChange = (itemId: number, caseKey: string, value: string) => {
    const cellKey = `${itemId}-${caseKey}`
    setInputValues(prev => ({
      ...prev,
      [cellKey]: value
    }))
  }

  // Handle OK button click
  const handleOk = (item: TableData, caseKey: string) => {
    const cellKey = `${item.id}-${caseKey}`
    const inputRaw = inputValues[cellKey] ?? ''
    const inputValue = inputRaw.trim().toLowerCase()
    const correctValue = (item[caseKey as keyof typeof item] ?? '').toString().toLowerCase()
    const isCorrect = inputValue === correctValue

    void sendAttempt(item.id, isCorrect)

    if (isCorrect) {
      // Correct answer
      const nextStates = {
        ...cellStates,
        [cellKey]: {
          isEditing: false,
          isCorrect: true,
          showAnswer: true,
          answer: item[caseKey as keyof typeof item]?.toString()
        }
      }
      setCellStates(nextStates)
      maybeCompleteWord(item.id, nextStates)
      setInputValues(prev => ({ ...prev, [cellKey]: '' }))
      setAttempts(prev => ({ ...prev, [cellKey]: 0 }))
    } else {
      // Wrong answer
      const currentAttempts = attempts[cellKey] || 0
      const newAttempts = currentAttempts + 1

      if (newAttempts >= 3) {
        // Show correct answer after 3 attempts
        const nextStates = {
          ...cellStates,
          [cellKey]: {
            isEditing: false,
            isCorrect: false,
            showAnswer: true,
            answer: item[caseKey as keyof typeof item]?.toString()
          }
        }
        setCellStates(nextStates)
        maybeCompleteWord(item.id, nextStates)
        setInputValues(prev => ({ ...prev, [cellKey]: '' }))
        setAttempts(prev => ({ ...prev, [cellKey]: 0 }))
      } else {
        // Allow another attempt
        setAttempts(prev => ({ ...prev, [cellKey]: newAttempts }))
        setInputValues(prev => ({ ...prev, [cellKey]: '' }))
      }
    }
  }

  // Handle Cancel button click
  const handleCancel = (itemId: number, caseKey: string) => {
    // Cancel all editing cells
    setCellStates(prev => {
      const newStates = { ...prev }
      Object.keys(newStates).forEach(key => {
        if (newStates[key]?.isEditing) {
          newStates[key] = { ...newStates[key], isEditing: false }
        }
      })
      return newStates
    })

    // Clear all input values
    setInputValues({})
  }
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
            onChange={(e) => handleInputChange(item.id, caseKey, e.target.value)}
            className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mr-1"
            placeholder="Enter word..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleOk(item, caseKey)
              } else if (e.key === 'Escape') {
                handleCancel(item.id, caseKey)
              }
            }}
            autoFocus
          />
          <div className="flex ml-1">
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleOk(item, caseKey)
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
                handleCancel(item.id, caseKey)
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
                  <div className="flex items-center justify-between gap-3">
                    <span>{item.word}</span>
                    {wordType && (
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          className="text-blue-500 hover:text-blue-700"
                          title="Increase priority"
                          onClick={(e) => {
                            e.stopPropagation()
                            void sendWeight(item.id, 'up')
                          }}
                        >
                          <Icon name="triangle-up" size="sm" />
                        </button>
                        <div className="text-[10px] text-gray-600 leading-none my-0.5">
                          {weights[item.id] ?? (typeof item.weight === 'number' ? item.weight : 0)}
                        </div>
                        <button
                          type="button"
                          className="text-blue-500 hover:text-blue-700 mt-1"
                          title="Decrease priority"
                          onClick={(e) => {
                            e.stopPropagation()
                            void sendWeight(item.id, 'down')
                          }}
                        >
                          <Icon name="triangle-down" size="sm" />
                        </button>
                      </div>
                    )}
                  </div>
                </td>

                {/* Case Columns */}
                {cases.map((case_) => (
                  <td
                    key={`${item.id}-${case_.key}`}
                    className={getCellClass(item, case_.key)}
                    onClick={() => handleCellClick(item.id, case_.key)}
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
