# Prompt — One image-upload empty state, everywhere

> Hand this whole file to Claude. It is the brief, not notes about the brief.

---

## 0. The task

Every "upload an image" **empty** container in the Support Portal builder module currently looks
different — a different border colour, a different icon, a different sentence, a different size.
Find **all of them**, in the **design panel (sidebar)** and **inline on the canvas**, and replace
each one with a single shared component built to the spec in §3.

**Replace, don't restyle.** The outcome is ONE component used in N places, not N containers edited
to look alike. Anything else drifts again the first time somebody touches one of them.

---

## 1. Scope — what counts

**In scope: any container whose empty state means "there is no image here yet, put one here."**
That is true whether it accepts a file by click, by drag-and-drop, or both, and whether it lives in
the right-hand design panel or on the canvas.

**Out of scope — leave alone:**
- Dropzones for non-image payloads: the OS-Upgrade ISO zone, the BOM ingest `.json`/`.xml` zone,
  email attachments. Same family, different content rules — a separate pass if we want it.
- Placeholders that are not an image slot at all: Spacer, Divider, Button, the icon placeholder,
  "No Data Found" rows in live-data cards.

**Judgement call you must make explicitly, per site:** a container that *looks* like a dropzone but
opens no picker is a lie. If a placeholder gets this treatment, **wire it up** — click opens the
file picker, drag-and-drop accepts the drop. If a given site genuinely cannot accept a file inline
(the upload only belongs in the panel), then it does **not** get this treatment; give it the plain
`ImageOff` placeholder instead and say so in your summary. Do not ship a decorative dropzone.

---

## 2. Find them all

Sweep first, list what you found, then change anything. Start from these greps:

```
border-dashed            # every dashed container in the module
type="file"              # every real file input
UploadZone               # the current shared control and its call sites
drag and drop|Drop an|browse|Upload
ImageOff|ImageIcon|Image as ImageIcon
```

**Known sites — treat as a starting checklist, not the answer.** Verify each and keep sweeping;
this list was compiled by eye and will be missing some.

**Sidebar / design panel**
| Where | File |
|---|---|
| `UploadZone` empty state — the main one, reached by the `upload` and `bannerUpload` field kinds | [PortalControls.tsx:734](src/app/components/PortalControls.tsx#L734) |
| P1 style pack, "Background image" | [PortalStylePacks.tsx:106](src/app/components/PortalStylePacks.tsx#L106) |
| Widget drawer `upload` / `bannerUpload` cases | [PortalWidgetDrawer.tsx:709](src/app/components/PortalWidgetDrawer.tsx#L709) |
| Icon picker — custom SVG/PNG upload | [PortalIconPicker.tsx:181](src/app/components/PortalIconPicker.tsx#L181) |
| Branding panel — logo slot | [PortalBrandingPanel.tsx:208](src/app/components/PortalBrandingPanel.tsx#L208) |
| Gallery bulk add ("or add several files at once") | [PortalWidgetDrawer.tsx:66](src/app/components/PortalWidgetDrawer.tsx#L66) |

**Inline / canvas**
| Where | File |
|---|---|
| Placed Image element, empty | [PortalPlacedElement.tsx:412](src/app/components/PortalPlacedElement.tsx#L412) |
| Gallery / card image, empty (`ImageOff`) | [PortalCollectionRender.tsx:1108](src/app/components/PortalCollectionRender.tsx#L1108) |
| Preview empty column | [SupportPortalPreview.tsx:153](src/app/components/SupportPortalPreview.tsx#L153) |

Report the final list with file:line before you edit, including anything you found that isn't above.

---

## 3. The target UI

Replicate this exactly. It is a centred vertical stack inside a dashed rounded box.

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│                                                           │
│                        ┌────────┐                         │   ← file glyph, outline only,
│                        │        │                         │     folded top-right corner
│                        │   (↑)  │                         │   ← round accent badge, cloud-up
│                        └────────┘                         │     glyph, OVERLAPPING the file
│                                                           │
│              Click to upload or drag and drop             │   ← "Click to upload" underlined
│                  ‾‾‾‾‾‾‾‾‾‾‾‾‾‾                           │
│                 PNG, JPG, SVG · max 5MB                   │   ← helper, small, grey
│                                                           │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

### 3.1 The icon lockup — the distinctive part, get this right

Two layers, not one glyph:
1. **A file/document outline** — lucide `File` (it already has the folded top-right corner),
   `strokeWidth={1.5}`, colour `#D0D5DD`, no fill.
2. **A filled circular badge** overlapping it — centred horizontally, its centre sitting at about
   **62% down the file's height** so it straddles the file's lower body. Solid accent fill, a
   **2px white ring** so it reads as a separate layer, and a white lucide `UploadCloud` inside.

```tsx
<span className="relative inline-flex">
  <File size={40} strokeWidth={1.5} className="text-[#D0D5DD]" />
  <span className="absolute left-1/2 top-[62%] flex size-6 -translate-x-1/2 -translate-y-1/2
                   items-center justify-center rounded-full bg-[#3D8BD0] ring-2 ring-white">
    <UploadCloud size={13} strokeWidth={2} className="text-white" />
  </span>
</span>
```

⚠️ **Accent colour.** The reference image is Tiptap purple. Use **`#3D8BD0`** — the product accent
this whole builder is built from — so the zone belongs to our UI rather than borrowing someone
else's brand. It is one token: swap it if we decide otherwise.

### 3.2 Copy

- **Line 1 is always:** `Click to upload` + ` or drag and drop`. `Click to upload` is
  **underlined** and one weight heavier; the rest is regular. Both are the same dark colour — do
  **not** colour it blue. The whole box is clickable, so the underline is enough signal and a
  coloured link on top of it over-signals.
- **Line 2 is generated from the slot's real limits, never hardcoded.** Build it from the actual
  `accept` and size cap: `PNG, JPG, SVG or WebP · max 5MB`. Only say "Maximum 3 files" where three
  files are genuinely allowed — every slot in this module except the gallery takes exactly one.
  ⚠️ A helper line that promises a limit the slot doesn't have is worse than no helper line.

### 3.3 Measurements

Two sizes, one component, chosen by a `size` prop. The panel is 340–600px wide and the canvas is
not, so a single size cannot serve both.

| | `sm` — sidebar / panel | `md` — inline / canvas |
|---|---|---|
| Padding | `24px 16px` | `40px 24px` |
| Border radius | `8px` | `8px` |
| File glyph | `32px` | `40px` |
| Badge | `20px` circle, `11px` glyph | `24px` circle, `13px` glyph |
| Gap icon → line 1 | `10px` | `12px` |
| Gap line 1 → line 2 | `3px` | `4px` |
| Line 1 | `13px / 18px`, medium | `14px / 20px`, medium |
| Line 2 | `11px / 16px` | `12px / 18px` |
| Min height | `132px` | `180px` |

### 3.4 Colours

| Token | Value |
|---|---|
| Border, rest | `#D9E0EA` dashed 1px |
| Border, hover | `#3D8BD0` |
| Border + fill, drag-over | `#3D8BD0` on `#EBF5FF` |
| Background, rest | `#FFFFFF` |
| File glyph | `#D0D5DD` |
| Badge fill | `#3D8BD0`, `ring-2 ring-white` |
| Line 1 text | `#364658` |
| Line 2 text | `#9CA3AF` |
| Error border / text | `#EF4444` / `#B42318` |

⚠️ Tailwind's default dash is tighter than the reference. If it reads wrong at these sizes, draw the
border with an SVG background instead of `border-dashed` so the dash length is ours:

```css
background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect
  width='100%25' height='100%25' fill='none' rx='8' stroke='%23D9E0EA' stroke-width='1'
  stroke-dasharray='8 6'/%3E%3C/svg%3E");
```

---

## 4. States

| State | Treatment |
|---|---|
| Rest | as §3 |
| Hover | border → accent, badge one step darker, cursor pointer |
| Drag-over | accent border + `#EBF5FF` fill, badge full accent — the whole box responds, not the icon alone |
| Focus (keyboard) | 2px accent focus ring, visible without a mouse |
| Uploading | badge swaps to a determinate ring, line 1 → `Uploading… 62%` |
| Error | red border, line 2 → the reason (`That file is 8MB — the limit is 5MB`), and the zone stays usable so the next attempt is one click |
| Disabled | 50% opacity, no hover, no drop, and a reason on the element |
| **Filled** | **unchanged** — keep today's behaviour: 92px preview on the chequerboard + **Replace**. This brief is about the EMPTY state only. |

⚠️ Keep "Replace", not "Remove". Every one of these slots is filled because something has to be
there, so swapping is the common move and the destructive verb must not sit on it.

---

## 5. Rules that must hold

1. **One component.** `ImageUploadZone` (or the existing `UploadZone`, extended). No site keeps its
   own markup. If a site needs something different, it needs a prop, not a copy.
2. **Looks like a dropzone ⇒ is a dropzone.** Click opens the picker AND drop accepts the file.
3. **Drop is scoped to the zone**, and the page must not navigate when a file is dropped outside it
   — add the document-level `dragover`/`drop` preventDefault if it isn't already there.
4. **The helper line is derived** from `accept` + max size, not typed per call site.
5. **Multi-file wording only where multi-file is true.** `multiple` drives both the input and the
   copy from one flag.
6. Validation happens **before** any preview is drawn — wrong type or oversized never shows a
   thumbnail first and an error second.
7. The canvas variant must not swallow the builder's own selection click: dropping an image selects
   the element it landed on, and clicking still selects before it opens the picker.

---

## 6. Accessibility

- The zone is a real `<button>` (or an input with a `<label>`), reachable by Tab, activated by
  Enter and Space.
- `aria-label` names the slot, not the action: `Upload logo image`, not `Upload`.
- The helper and any error are tied to the control with `aria-describedby`; the error is announced
  (`role="status"` / `aria-live="polite"`).
- Focus is visible on the whole box, and never conveyed by border colour alone.

---

## 7. Definition of done

Show me, in the browser:

1. The sweep list — every site found, with file:line, and which ones you changed.
2. The same zone in the sidebar (`sm`) and on the canvas (`md`): same lockup, different scale.
3. Drag a PNG over a canvas image element → the whole box turns accent-on-tint → drop → it lands.
4. Drop a 9MB file → red border, the reason in the helper line, zone still usable.
5. Tab to a zone → visible ring → Space opens the picker.
6. A filled slot still shows the 92px chequerboard preview and **Replace**.
7. `grep -rn "border-dashed" src/app/components/Portal*` returns **no** hand-rolled image-upload
   empty states — only the one component and the out-of-scope placeholders from §1.
