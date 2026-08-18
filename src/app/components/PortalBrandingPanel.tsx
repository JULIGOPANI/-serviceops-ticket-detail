import { useState } from 'react';
import { Eye, Paperclip, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Field, Group, RichText, SelectField, Segmented, TextField, ToggleRow } from './PortalControls';

/* Organization › Branding, in the builder's 340px rail.
 *
 * The source form is a two-column sprawl of eighteen fields — five upload rows each with their own
 * button, chip and preview, two conditional help blocks, and a rich-text greeting — with no grouping
 * beyond one hairline. At 340px two columns are not available, which is a good thing: it forces the
 * only structure that actually helps, which is ORDER BY QUESTION.
 *
 * ⚠️ Five groups, and the order is the argument: what the product is CALLED, how people REACH you,
 * what they SEE first, the ARTWORK, and finally the help affordances. Someone renaming the portal
 * never has to scroll past a favicon uploader to do it.
 *
 * ⚠️ Built entirely from the shared control kit — same `Group` chrome as the detail pages'
 * properties panel, same `Field` label treatment, same 32px controls. Nothing bespoke, so this
 * panel inherits every future fix to those. */

interface Asset { name: string; src: string }

/* One upload row. ⚠️ The three states are one component, not three: an empty row, a row with a file,
   and its preview all answer "what artwork is here" — split up, the preview drifted into a second
   column and stopped being next to the thing it previews. */
function AssetRow({ label, hint, value, onChange }: {
  label: string; hint: string; value?: Asset; onChange: (a?: Asset) => void;
}) {
  const [zoom, setZoom] = useState(false);
  return (
    <Field label={label} help={hint}>
      {value ? (
        /* ⚠️ The preview is the ROW ITSELF, at full panel width. A 56px thumbnail beside a filename
           cannot answer "is this logo right" — which is the only question this control exists for —
           and the source form's answer, a preview in a second column, made you look in two places.
           The artwork is shown as large as the panel allows and the metadata sits under it. */
        <div className="overflow-hidden rounded border border-[#E5E7EB] bg-white">
          <button
            onClick={() => setZoom(true)}
            title="View full size"
            /* The chequerboard is what makes a transparent PNG readable. A logo on flat white looks
               identical whether its background is transparent or white, and those are very
               different files once it lands on a dark header. */
            className="flex h-[104px] w-full items-center justify-center p-3"
            style={{
              backgroundImage:
                'linear-gradient(45deg,#F1F5F9 25%,transparent 25%),linear-gradient(-45deg,#F1F5F9 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#F1F5F9 75%),linear-gradient(-45deg,transparent 75%,#F1F5F9 75%)',
              backgroundSize: '12px 12px',
              backgroundPosition: '0 0,0 6px,6px -6px,-6px 0',
            }}
          >
            <img src={value.src} alt="" className="max-h-full max-w-full object-contain" />
          </button>
          <div className="flex items-center gap-1 border-t border-[#E5E7EB] px-2 py-1.5">
            <Paperclip size={12} className="flex-shrink-0 text-[#9CA3AF]" />
            <span className="min-w-0 flex-1 truncate text-[12px] text-[#364658]">{value.name}</span>
            <button
              onClick={() => setZoom(true)}
              title="View full size"
              className="flex size-7 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F1F5F9]"
            ><Eye size={14} /></button>
            <button
              onClick={() => onChange(undefined)}
              title="Remove"
              className="flex size-7 flex-shrink-0 items-center justify-center rounded text-[#EF4444] transition-colors hover:bg-[#FEF3F2]"
            ><Trash2 size={14} /></button>
          </div>

          {/* ⚠️ A modal, NOT `window.open`. These are data: URLs — browsers block opening one in a
              new tab, so the old "view full size" button silently did nothing at all. */}
          {zoom && (
            <div
              onClick={() => setZoom(false)}
              className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 p-8"
            >
              <img src={value.src} alt={value.name} className="max-h-full max-w-full rounded bg-white object-contain p-2 shadow-2xl" />
            </div>
          )}
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-[#C3CBD6] bg-[#FAFBFC] py-3 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:border-[#3D8BD0] hover:bg-[#F5F9FD]">
          <Upload size={14} /> Upload
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const fr = new FileReader();
              fr.onload = () => onChange({ name: f.name, src: String(fr.result) });
              fr.readAsDataURL(f);
              e.target.value = '';
            }}
          />
        </label>
      )}
    </Field>
  );
}

/* The two help blocks are identical apart from who they are for, so they are one component. ⚠️ The
   icon and the URL only exist once help is ON — a URL for a help button nobody can see is a field
   with nothing behind it (§2.2: absent, not disabled). */
function HelpBlock({ who, on, onToggle, mode, onMode, url, onUrl, icon, onIcon }: {
  who: string; on: boolean; onToggle: (v: boolean) => void;
  mode: string; onMode: (v: string) => void;
  url: string; onUrl: (v: string) => void;
  icon?: Asset; onIcon: (a?: Asset) => void;
}) {
  return (
    <>
      <ToggleRow label={`Enable help for the ${who}`} on={on} onChange={onToggle} />
      {on && (
        <>
          <Field label="Help opens" tight>
            <Segmented
              value={mode}
              onChange={onMode}
              options={[{ value: 'url', label: 'A link' }, { value: 'file', label: 'A document' }]}
            />
          </Field>
          {mode === 'url'
            ? <Field label="URL"><TextField value={url} onChange={onUrl} placeholder="https://" /></Field>
            : <AssetRow label="Document" hint="Shown when the help button is used." value={icon} onChange={onIcon} />}
          <AssetRow label="Help icon" hint="16 × 16 px. Falls back to the product's own icon when empty." value={icon} onChange={onIcon} />
        </>
      )}
    </>
  );
}

const SECTIONS = ['Identity', 'Contact', 'First impression', 'Logos & images', 'Help'];

export function PortalBrandingPanel() {
  const [open, setOpen] = useState<string[]>(['Identity']);
  const toggle = (g: string) => setOpen((o) => (o.includes(g) ? o.filter((x) => x !== g) : [...o, g]));

  const [v, setV] = useState<Record<string, unknown>>({
    helpdesk: 'Helpdesk Portal',
    supportTitle: 'Support Portal',
    techTitle: 'Technician Portal',
    email: 'support@motadata.com',
    phone: '+91 9974910704',
    linkback: '',
    login: 'Single login screen',
    landing: 'login',
    greeting: '<b>Welcome to IT Service Portal</b>',
    /* ⚠️ Seeded, not empty. Every tenant already has a logo — an empty uploader would claim the
       product is unbranded and invite you to 'add' the mark it is already showing. */
    logo: { name: 'logo.png', src: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20100%22%3E%3Ccircle%20cx%3D%2240%22%20cy%3D%2234%22%20r%3D%227%22%20fill%3D%22%231E3A8A%22%2F%3E%3Ccircle%20cx%3D%2258%22%20cy%3D%2228%22%20r%3D%227%22%20fill%3D%22%232563EB%22%2F%3E%3Ccircle%20cx%3D%2276%22%20cy%3D%2226%22%20r%3D%227%22%20fill%3D%22%230EA5E9%22%2F%3E%3Ccircle%20cx%3D%2294%22%20cy%3D%2228%22%20r%3D%227%22%20fill%3D%22%2322C55E%22%2F%3E%3Ctext%20x%3D%2228%22%20y%3D%2274%22%20font-family%3D%22Inter%2Csans-serif%22%20font-size%3D%2230%22%20font-weight%3D%22700%22%20fill%3D%22%231E293B%22%3Emotadata%3C%2Ftext%3E%3C%2Fsvg%3E' },
    supportHelp: false, supportHelpMode: 'url', supportHelpUrl: '',
    techHelp: false, techHelpMode: 'url', techHelpUrl: '',
  });
  const set = (k: string, x: unknown) => setV((p) => ({ ...p, [k]: x }));
  const str = (k: string) => String(v[k] ?? '');
  const asset = (k: string) => v[k] as Asset | undefined;

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <p className="mb-1 mt-3 text-[12px] leading-[1.55] text-[#7B8FA5]">
          The organization identity, across every portal. Changing it here changes it everywhere.
        </p>

        <Group title="Identity" open={open.includes('Identity')} onToggle={() => toggle('Identity')}>
          <Field label="Helpdesk name"><TextField value={str('helpdesk')} onChange={(x) => set('helpdesk', x)} /></Field>
          <Field label="Support portal title"><TextField value={str('supportTitle')} onChange={(x) => set('supportTitle', x)} /></Field>
          <Field label="Technician portal title"><TextField value={str('techTitle')} onChange={(x) => set('techTitle', x)} /></Field>
        </Group>

        <Group title="Contact" open={open.includes('Contact')} onToggle={() => toggle('Contact')}>
          {/* ⚠️ These three are grouped because they are all "how someone reaches you", not because
              they are all text inputs. Support email sitting under a portal title was the source
              form's arrangement, and it put two unrelated questions side by side. */}
          <Field label="Support email"><TextField value={str('email')} onChange={(x) => set('email', x)} /></Field>
          <Field label="Support contact number"><TextField value={str('phone')} onChange={(x) => set('phone', x)} /></Field>
          <Field label="Linkback URL" help="Where the logo takes a requester when they click it.">
            <TextField value={str('linkback')} onChange={(x) => set('linkback', x)} placeholder="https://" />
          </Field>
        </Group>

        <Group title="First impression" open={open.includes('First impression')} onToggle={() => toggle('First impression')}>
          <Field label="Login screen">
            <SelectField
              value={str('login')}
              onChange={(x) => set('login', x)}
              options={['Single login screen', 'Separate requester and technician screens']}
            />
          </Field>
          <Field label="Guests land on">
            <Segmented
              value={str('landing')}
              onChange={(x) => set('landing', x)}
              options={[{ value: 'home', label: 'Home page' }, { value: 'login', label: 'Login page' }]}
            />
          </Field>
          <Field label="Greeting message">
            <RichText value={str('greeting')} onChange={(x) => set('greeting', x)} placeholder="Welcome to…" />
          </Field>
        </Group>

        <Group title="Logos & images" open={open.includes('Logos & images')} onToggle={() => toggle('Logos & images')}>
          <AssetRow label="Brand logo" hint="200 × 100 px for the sharpest result." value={asset('logo')} onChange={(a) => set('logo', a)} />
          <AssetRow label="Dark-theme logo" hint="Used wherever the background is dark." value={asset('logoDark')} onChange={(a) => set('logoDark', a)} />
          <AssetRow label="Favicon" hint="16 × 16 px. The browser-tab icon." value={asset('favicon')} onChange={(a) => set('favicon', a)} />
          <AssetRow label="Support portal banner" hint="1920 × 550 px. Sits behind the portal's hero." value={asset('banner')} onChange={(a) => set('banner', a)} />
          <AssetRow label="Product setup guide" hint="500 × 950 px. Shown to a new administrator." value={asset('setup')} onChange={(a) => set('setup', a)} />
        </Group>

        <Group title="Help" open={open.includes('Help')} onToggle={() => toggle('Help')}>
          <HelpBlock
            who="support portal"
            on={v.supportHelp === true} onToggle={(x) => set('supportHelp', x)}
            mode={str('supportHelpMode')} onMode={(x) => set('supportHelpMode', x)}
            url={str('supportHelpUrl')} onUrl={(x) => set('supportHelpUrl', x)}
            icon={asset('supportHelpIcon')} onIcon={(a) => set('supportHelpIcon', a)}
          />
          <div className="mt-5 border-t border-[#E5E7EB] pt-5">
            <HelpBlock
              who="technician portal"
              on={v.techHelp === true} onToggle={(x) => set('techHelp', x)}
              mode={str('techHelpMode')} onMode={(x) => set('techHelpMode', x)}
              url={str('techHelpUrl')} onUrl={(x) => set('techHelpUrl', x)}
              icon={asset('techHelpIcon')} onIcon={(a) => set('techHelpIcon', a)}
            />
          </div>
        </Group>
      </div>

      {/* ⚠️ A STICKY footer, unlike the rest of the builder. Everything else on this canvas applies
          live, but branding is org-wide — it reaches the technician portal and every login screen,
          not just the page being designed — so it takes a deliberate Save rather than changing the
          product under someone who was only looking. */}
      <div className="flex flex-shrink-0 justify-end gap-2 border-t border-[#E5E7EB] px-4 py-3">
        <button className="inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Cancel</button>
        <button
          onClick={() => toast.success('Branding saved')}
          className="inline-flex h-8 items-center rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0]"
        >Save</button>
      </div>
    </div>
  );
}
