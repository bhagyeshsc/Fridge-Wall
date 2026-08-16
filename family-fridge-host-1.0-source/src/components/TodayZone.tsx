/*
 * Spec §7 and §11: the count first, big, in the one filled colour block the
 * wall allows itself. Then the actual things, thin-ruled underneath it.
 *
 * Completing a task holds for a beat so you see it happen before it goes
 * (§11: tap check → confirmation → task leaves the active list).
 */

import { useEffect, useRef, useState } from 'react'
import { useFridge, openTasksToday, overdueTasks, laterTasks } from '../lib/store'
import type { Task } from '../lib/types'
import { Avatar } from './Avatar'
import { Check } from './Check'
import { Icon } from './Icon'

const LEAVE_MS = 420

interface TodayZoneProps {
  lens: string | null
}

export function TodayZone({ lens }: TodayZoneProps) {
  const { state, dispatch } = useFridge()
  const [leaving, setLeaving] = useState<string[]>([])
  const [assigning, setAssigning] = useState<string | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const t = timers.current
    return () => t.forEach(clearTimeout)
  }, [])

  const today = openTasksToday(state)
  const overdue = overdueTasks(state)
  const later = laterTasks(state)
  const active = [...overdue, ...today]
  const remaining = active.filter((t) => !leaving.includes(t.id)).length

  // Under a family lens, a zone with no match would otherwise just go grey
  // and look broken. Say so, and open the drawer if their thing is in there.
  const lensName = state.people.find((p) => p.id === lens)?.name ?? null
  const lensInActive = lens !== null && active.some((t) => t.assignee === lens)
  const lensInLater = lens !== null && later.some((t) => t.assignee === lens)

  const complete = (id: string) => {
    setLeaving((l) => [...l, id])
    const timer = window.setTimeout(() => {
      dispatch({ type: 'task/toggle', id })
      setLeaving((l) => l.filter((x) => x !== id))
    }, LEAVE_MS)
    timers.current.push(timer)
  }

  const row = (task: Task, dimmedByLens: boolean) => {
    const person = state.people.find((p) => p.id === task.assignee) ?? null
    const isLeaving = leaving.includes(task.id)
    const isOverdue = overdue.some((t) => t.id === task.id)

    return (
      <li
        key={task.id}
        className={`task${isLeaving ? ' is-leaving' : ''}${dimmedByLens ? ' is-dimmed' : ''}`}
      >
        <div className="task__main">
          <Check
            checked={isLeaving}
            onChange={() => complete(task.id)}
            tone="coral"
            label={`Mark "${task.title}" done`}
          />

          <div className="task__text">
            <p className="task__title t-body">{task.title}</p>
            {(task.note || isOverdue) && (
              <p className="task__note t-small muted">
                {isOverdue && <span className="task__overdue">Overdue</span>}
                {isOverdue && task.note && ' · '}
                {task.note}
              </p>
            )}
          </div>

          <button
            type="button"
            className="task__who"
            onClick={() => setAssigning(assigning === task.id ? null : task.id)}
            aria-label={
              person ? `Assigned to ${person.name}. Tap to reassign.` : 'Assign this to someone'
            }
          >
            {person ? (
              <Avatar person={person} size="sm" />
            ) : (
              <span className="task__unassigned t-small">Who?</span>
            )}
          </button>
        </div>

        {assigning === task.id && (
          <div className="assign settle-in">
            {state.people.map((p) => (
              <button
                type="button"
                key={p.id}
                className={`assign__opt${task.assignee === p.id ? ' is-on' : ''}`}
                onClick={() => {
                  dispatch({ type: 'task/assign', id: task.id, assignee: p.id })
                  setAssigning(null)
                }}
              >
                <Avatar person={p} size="sm" />
                <span className="t-small">{p.name}</span>
              </button>
            ))}
            <button
              type="button"
              className="assign__opt assign__clear"
              onClick={() => {
                dispatch({ type: 'task/remove', id: task.id })
                setAssigning(null)
              }}
            >
              <Icon name="trash" size={18} />
              <span className="t-small">Remove</span>
            </button>
          </div>
        )}
      </li>
    )
  }

  return (
    <section className="zone today" id="today" aria-labelledby="today-h">
      <h2 className="sr-only" id="today-h">
        Today
      </h2>

      <div className="today__grid">
        <div className="count">
          <p className="t-label count__eyebrow">
            {remaining === 0 ? 'All clear' : 'Needs someone'}
          </p>
          <div className="count__body">
            <p className="t-numeral count__n" key={remaining}>
              {String(remaining).padStart(2, '0')}
            </p>
            <p className="count__label t-section">
              {remaining === 1 ? 'thing' : 'things'}
              <br />
              to do
            </p>
          </div>
        </div>

        <div className="today__list">
          <p className="t-label today__eyebrow">
            <span className="tick tick--task" />
            Today
          </p>

          {active.length === 0 ? (
            <p className="empty t-body muted">
              All clear. Nothing needs doing today.
            </p>
          ) : (
            <ul>{active.map((t) => row(t, lens !== null && t.assignee !== lens))}</ul>
          )}

          {lens !== null && !lensInActive && (
            <p className="lens-empty t-small muted">
              Nothing of {lensName}&rsquo;s to do today.
            </p>
          )}

          {later.length > 0 && (
            <details className="later" open={lensInLater || undefined}>
              <summary className="t-small muted">
                {later.length} more later this week
              </summary>
              <ul>{later.map((t) => row(t, lens !== null && t.assignee !== lens))}</ul>
            </details>
          )}
        </div>
      </div>
    </section>
  )
}
