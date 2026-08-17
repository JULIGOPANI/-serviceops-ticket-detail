/* Support Portal builder — the collection contract (spec §4).
 *
 * ONE list, reused by FAQ, Card children, Table rows, Slider slides, Gallery photos and Feedback
 * follow-ups. Every row has the same anatomy and the same behaviours, because they are the same
 * thing: an ordered set of children that each open their own drawer.
 *
 * The behaviours that are easy to skip and are not optional:
 *   • Keyboard reorder (§4.1) — drag is never the ONLY way to move a row, so the ⌃/⌄ buttons are
 *     always there rather than appearing on hover.
 *   • Add appends, selects and OPENS the new item (§4.1), so you type into the new thing instead of
 *     hunting for it, and it arrives seeded with realistic copy — never `Untitled`.
 *   • Delete is immediate with an undo affordance, not a confirmation dialog (§4.1). A dialog for
 *     one row trains people to dismiss dialogs.
 *   • At the limit, Add DISABLES and says why. Silent no-ops are forbidden (§4.1).
 */

import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Copy, Eye, EyeOff, GripVertical, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export interface CollectionItem {
  id: string;
  hidden?: boolean;
  [k: string]: unknown;
}

interface Props {
  items: CollectionItem[];
  /** Row 1: the item's own text. Falls back to `Item N` when empty (§4.1). */
  label: (item: CollectionItem, index: number) => string;
  /** Row 2: the single most useful piece of metadata. Optional. */
  meta?: (item: CollectionItem, index: number) => string | undefined;
  /** A media thumbnail or the widget's glyph, instead of the index. */
  thumb?: (item: CollectionItem, index: number) => ReactNode;
  onOpen: (item: CollectionItem) => void;
  onChange: (next: CollectionItem[]) => void;
  addLabel: string;
  onAdd: () => void;
  max?: number;
  /** Collections where an item can be kept without publishing it. */
  hideable?: boolean;
  emptyHint: string;
  /* ⚠️ §7.23/§7.24 — the rail's destinations and the bar's items belong to the product. There is
     nothing to add and nothing to delete; the admin orders and hides them. */
  noAdd?: boolean;
  /** Items that cannot be hidden at all — the logo. Disabled WITH a reason, never absent. */
  lockedHide?: (item: CollectionItem) => string | undefined;
  /* The two field keys an item is usually edited by — [title, description]. Given these, a row
     expands in place to edit them; without them it only opens the full drawer. Derived from the
     collection's own fields, so a widget never has to restate what its item is made of. */
  inlineKeys?: [string, string];
}

const inputCls = 'h-9 w-full rounded border border-[#d1d5db] bg-white px-3 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';

export function PortalItemList({
  items, label, meta, thumb, onOpen, onChange, addLabel, onAdd, max, hideable, emptyHint,
  noAdd, lockedHide, inlineKeys,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  /** Which row is open for inline editing. One at a time — a list of open editors is not a list. */
  const [expanded, setExpanded] = useState<number | null>(null);
  /** The last delete, so it can be put back. Undo is not optional (§8.4 rule 6). */
  const undoRef = useRef<{ item: CollectionItem; at: number } | null>(null);

  const atLimit = max !== undefined && items.length >= max;

  /* ⚠️ All of these take an INDEX. They used to look the item up by `x.id === …`, which silently
     matched every row whenever the items had no ids — the same fault that made hiding one item hide
     the whole list. Nothing here depends on an id existing any more. */
  const moveAt = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (i < 0 || j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const drop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = items.findIndex((x) => x.id === dragId);
    const to = items.findIndex((x) => x.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...items];
    next.splice(from, 1);
    next.splice(to, 0, items[from]);
    onChange(next);
  };

  const removeAt = (at: number) => {
    const item = items[at];
    undoRef.current = { item, at };
    onChange(items.filter((_, j) => j !== at));
    toast.success(`“${label(item, at)}” removed`, {
      action: {
        label: 'Undo',
        onClick: () => {
          const u = undoRef.current;
          if (!u) return;
          const next = [...items];
          next.splice(u.at, 0, u.item);
          onChange(next);
        },
      },
    });
  };

  const duplicateAt = (at: number) => {
    const clone = { ...items[at], id: `${Date.now().toString(36)}${at}` };
    const next = [...items];
    next.splice(at + 1, 0, clone);
    onChange(next);
    toast.success('Duplicated');
  };

  const iconBtn = 'flex size-6 items-center justify-center rounded text-[#9CA3AF] transition-colors hover:bg-[#F1F5F9] hover:text-[#364658]';

  return (
    <div className="mt-2">
      {items.length === 0 ? (
        <div className="rounded border border-dashed border-[#C3CBD6] px-3 py-6 text-center">
          <p className="text-[12px] leading-[1.6] text-[#7B8FA5]">{emptyHint}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, i) => {
            /* ⚠️ Every operation is keyed by INDEX, never by `item.id`. Seeded items do not all carry
               an id, so `x.id === item.id` compared undefined to undefined and matched EVERY row —
               which is why hiding one item hid the whole list. Index is what the rendered list is
               actually ordered by, and it cannot be absent or duplicated. */
            const patch = (p: CollectionItem) => onChange(items.map((x, j) => (j === i ? { ...x, ...p } : x)));
            const open = expanded === i;
            const locked = lockedHide?.(item);
            return (
              <div
                key={item.id ?? i}
                className={`rounded border bg-white transition-colors ${
                  overId === item.id && dragId !== item.id ? 'border-[#3D8BD0]' : open ? 'border-[#3D8BD0]' : 'border-[#E5E7EB]'
                } ${dragId === item.id ? 'opacity-40' : ''} ${item.hidden ? 'bg-[#FAFBFC]' : ''}`}
              >
                <div
                  draggable
                  onDragStart={() => setDragId(item.id)}
                  onDragEnd={() => { setDragId(null); setOverId(null); }}
                  onDragOver={(e) => { e.preventDefault(); setOverId(item.id); }}
                  onDrop={(e) => { e.preventDefault(); drop(item.id); setDragId(null); setOverId(null); }}
                  /* The row EXPANDS in place. Opening the full drawer is the chevron at the end —
                     editing two words should not cost you the panel you were already looking at. */
                  onClick={() => setExpanded(open ? null : i)}
                  className="group/row flex cursor-pointer items-center gap-2 px-2 py-2"
                >
                  <span className="flex-shrink-0 cursor-grab text-[#C3CBD6]"><GripVertical size={14} /></span>

                  {/* ⚠️ No index badge. The number restated the row's position, which the order
                      already says, and it took the width a thumbnail actually needs. */}
                  {thumb?.(item, i) && (
                    <span className="flex size-7 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-[#F1F5F9]">
                      {thumb(item, i)}
                    </span>
                  )}

                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[13px] ${item.hidden ? 'text-[#9CA3AF]' : 'text-[#364658]'}`}>
                      {label(item, i) || `Item ${i + 1}`}
                    </span>
                    {meta?.(item, i) && <span className="block truncate text-[11px] text-[#9CA3AF]">{meta(item, i)}</span>}
                  </span>

                  {/* Keyboard/pointer reorder — always present, because drag alone excludes people. */}
                  <span className="flex flex-shrink-0 items-center">
                    <button onClick={(e) => { e.stopPropagation(); moveAt(i, -1); }} disabled={i === 0} title="Move up" className={`${iconBtn} disabled:opacity-30`}><ChevronUp size={13} /></button>
                    <button onClick={(e) => { e.stopPropagation(); moveAt(i, 1); }} disabled={i === items.length - 1} title="Move down" className={`${iconBtn} disabled:opacity-30`}><ChevronDown size={13} /></button>
                    {hideable && (
                      <button
                        disabled={!!locked}
                        onClick={(e) => { e.stopPropagation(); if (!locked) patch({ hidden: !item.hidden }); }}
                        title={locked ?? (item.hidden ? 'Show on the portal' : 'Keep it here but do not publish it')}
                        className={`${iconBtn} ${locked ? 'cursor-not-allowed opacity-40 hover:bg-transparent' : ''}`}
                      >{item.hidden ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                    )}
                    {/* Product-owned lists have nothing to duplicate or delete — the destinations are
                        not the admin's to invent. */}
                    {!noAdd && <button onClick={(e) => { e.stopPropagation(); duplicateAt(i); }} title="Duplicate" className={iconBtn}><Copy size={13} /></button>}
                    {!noAdd && <button onClick={(e) => { e.stopPropagation(); removeAt(i); }} title="Delete" className={`${iconBtn} hover:bg-[#FEF3F2] hover:text-[#EF4444]`}><Trash2 size={13} /></button>}
                    <button onClick={(e) => { e.stopPropagation(); onOpen(item); }} title="Open all settings for this item" className={iconBtn}><ChevronRight size={14} /></button>
                  </span>
                </div>

                {/* Inline editor — the two fields you actually change, without leaving the list. */}
                {open && inlineKeys && (
                  <div className="border-t border-[#F0F2F5] px-3 pb-3 pt-2.5" onClick={(e) => e.stopPropagation()}>
                    <div className="mb-1 text-[12px] font-normal text-[#7B8FA5]">Title</div>
                    <input
                      value={String(item[inlineKeys[0]] ?? '')}
                      onChange={(e) => patch({ [inlineKeys[0]]: e.target.value })}
                      className={inputCls}
                    />
                    <div className="mb-1 mt-3 flex items-center justify-between gap-2">
                      <span className="text-[12px] font-normal text-[#7B8FA5]">Description</span>
                      {/* ⚠️ Per ITEM, not per widget. Some points need a second line and some do not,
                          and blanking the text to hide it would lose what was written. */}
                      <button
                        onClick={() => patch({ descHidden: !item.descHidden })}
                        title={item.descHidden ? 'Show this description' : 'Hide this description on the portal'}
                        className={`${iconBtn} ${item.descHidden ? 'text-[#3D8BD0]' : ''}`}
                      >{item.descHidden ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                    </div>
                    <textarea
                      rows={2}
                      value={String(item[inlineKeys[1]] ?? '')}
                      onChange={(e) => patch({ [inlineKeys[1]]: e.target.value })}
                      className={`${inputCls} h-auto py-1.5 ${item.descHidden ? 'opacity-50' : ''}`}
                    />
                    {item.descHidden && (
                      <p className="mt-1.5 text-[11px] leading-[1.5] text-[#9CA3AF]">
                        Kept here, not shown on the portal.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* The sticky footer's job (§2.1): the single Add action, reachable down a long list.
          Absent entirely on product-owned lists — there is nothing to add. */}
      {noAdd ? null : <button
        onClick={() => { if (!atLimit) onAdd(); }}
        disabled={atLimit}
        title={atLimit ? `This collection holds at most ${max}` : undefined}
        className={`mt-2.5 flex w-full items-center justify-center gap-1.5 rounded border border-dashed px-3 py-2 text-[13px] font-medium transition-colors ${
          atLimit
            ? 'cursor-not-allowed border-[#E5E7EB] text-[#C3CBD6]'
            : 'border-[#3D8BD0] text-[#3D8BD0] hover:bg-[#EBF5FF]'
        }`}
      ><Plus size={14} /> {addLabel}</button>}
      {!noAdd && atLimit && (
        <p className="mt-1.5 text-[11px] leading-[1.5] text-[#9CA3AF]">
          {max} is the most this widget holds. Remove one to add another.
        </p>
      )}
    </div>
  );
}
