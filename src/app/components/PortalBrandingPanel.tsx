import { useRef, useState } from 'react';
import { Eye, Info, Paperclip, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Field, SelectField, Segmented, TextField, ToggleRow } from './PortalControls';

/* Branding — what this portal calls itself and who a requester contacts.
 *
 * ⚠️ Only the settings that belong to THIS portal. It used to carry the technician portal's title
 * and help block, the login-screen choice, the setup-guide image and five asset uploaders — org-wide
 * surfaces an admin reaches from Admin › Branding. Showing them here made the builder look like it
 * edited the whole product, and put settings in front of you that nothing on this canvas could ever
 * reflect. The footer note says where those live instead, so the removal reads as a signpost rather
 * than a gap.
 *
 * ⚠️ And the LOGO is not here any more. It is edited by selecting the logo on the page, where its
 * upload sits in the element's own Content section — an image you can see is an image you should be
 * able to click. */

/** A read-only row: the value is a fact about the tenant, not a setting. */
function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-4">
      <p className="mb-1 text-[12px] text-[#7B8FA5]">{label}</p>
      {/* ⚠️ Shown, not hidden. Which company and which URL this portal answers on is the first thing
          anyone needs to confirm they are editing the right one — and a disabled field says "this is
          decided elsewhere" far better than an absence does. */}
      <div className="flex h-9 w-full items-center rounded border border-[#E5E7EB] bg-[#F7F9FC] px-2.5 text-[13px] text-[#7B8FA5]">
        {value}
      </div>
    </div>
  );
}

/** A field whose value falls back to the org-wide setting until this portal overrides it. */
function Inherited({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  /* ⚠️ The badge is the whole point of the row. Without it an inherited value and an overridden one
     look identical — you cannot tell whether you are seeing the global default or a decision
     somebody already made here, which is exactly the question this screen has to answer. */
  const own = value.trim().length > 0;
  return (
    <div className="mb-4">
      <p className="mb-1 flex items-center gap-1.5">
        <span className="text-[12px] text-[#7B8FA5]">{label}</span>
        {!own && <span className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-medium text-[#7B8FA5]">Inherited</span>}
      </p>
      <TextField value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}

const Head = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-3 mt-6 border-b border-[#E5E7EB] pb-2 text-[13px] font-semibold text-[#364658]">{children}</p>
);

const Note = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-4 flex gap-2 rounded-lg bg-[#F7F9FC] p-3">
    <Info size={14} className="mt-0.5 flex-shrink-0 text-[#9CA3AF]" />
    <p className="text-[12px] leading-[1.55] text-[#7B8FA5]">{children}</p>
  </div>
);

export function PortalBrandingPanel() {
  const [v, setV] = useState<Record<string, string>>({
    name: 'Acme Support',
    title: '',
    landing: 'home',
    idp: 'None — use ServiceOps login',
    email: '',
    phone: '',
  });
  const set = (k: string, x: string) => setV((p) => ({ ...p, [k]: x }));

  /* Help for the requester — its own state rather than another string in `v`, because it is a
     switch, a file, a choice and a URL rather than one more text field. */
  const [help, setHelp] = useState(true);
  const [helpIcon, setHelpIcon] = useState('');
  const [helpKind, setHelpKind] = useState<'url' | 'file'>('url');
  const [helpUrl, setHelpUrl] = useState('https://docs.motadata.com/serviceops-docs/');
  const [helpDoc, setHelpDoc] = useState('');
  const iconRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
        <Field label="Portal name">
          <TextField value={v.name} onChange={(x) => set('name', x)} />
        </Field>

        <ReadOnly
          label="Company"
          value="Acme Corporation"
        />
        <ReadOnly
          label="Portal URL"
          value="https://support.acme.com"
        />

        <Inherited
          label="Support Portal Title"
          value={v.title}
          onChange={(x) => set('title', x)}
          placeholder="Support Portal"
        />

        <Field label="Landing Page for Guest Users">
          <Segmented
            value={v.landing}
            onChange={(x) => set('landing', x)}
            options={[{ value: 'home', label: 'Home Page' }, { value: 'login', label: 'Login Page' }]}
          />
        </Field>

        <Head>Help</Head>
        {/* Everything below hangs off this switch, so it is the first thing asked. */}
        <ToggleRow
          label="Enable Help For Support Portal"
          on={help}
          onChange={setHelp}
        />
        {/* ⚠️ The rest is REMOVED when help is off, not greyed. A disabled icon uploader under a
            switch you have just turned off is a control explaining a state you can already see. */}
        {help && (
          <div className="mt-5">
            <div className="mb-1 flex items-center gap-2">
              <span className="flex min-w-0 items-center gap-1 text-[12px] text-[#7B8FA5]">
                Help Icon
                {/* ⚠️ The SIZE lives in the ⓘ, not in the label. "(16px X 16px For Better
                    Resolution)" is a hint you need once, while you are choosing a file — as a
                    permanent parenthesis it doubled the length of the label every time you read the
                    row afterwards. */}
                <Info
                  size={12}
                  className="flex-shrink-0 cursor-help text-[#9CA3AF]"
                  title="16 × 16 px gives the sharpest result. A larger square works — it will be scaled down."
                />
              </span>
              {/* ⚠️ Preview sits with the icon it previews and is DISABLED until there is one, with
                  the reason on it. Offering to preview nothing is the kind of dead control that
                  teaches people to stop trusting the row. */}
              <button
                onClick={() => toast.success('Showing the help icon as a requester sees it')}
                disabled={!helpIcon}
                title={helpIcon ? undefined : 'Upload an icon first — there is nothing to preview yet'}
                className={`ml-auto text-[12px] font-medium ${
                  helpIcon ? 'text-[#3D8BD0] hover:underline' : 'cursor-not-allowed text-[#C4CDD8]'
                }`}
              >Preview</button>
            </div>

            <button
              onClick={() => iconRef.current?.click()}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded bg-[#1E293B] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#0F172A]"
            ><Upload size={14} /> Upload Help View Icon For Requester</button>
            <input
              ref={iconRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const fr = new FileReader();
                fr.onload = () => { setHelpIcon(String(fr.result)); toast.success(`${f.name} uploaded`); };
                fr.readAsDataURL(f);
              }}
            />

            {/* The file's own row — what is attached, look at it, remove it. */}
            <div className="mt-2 inline-flex items-center gap-1 rounded bg-[#F1F5F9] px-1.5 py-1">
              <span className="flex size-6 items-center justify-center rounded text-[#64748B]" title={helpIcon ? 'Icon attached' : 'No icon attached yet'}>
                <Paperclip size={13} />
              </span>
              <button
                onClick={() => toast.success('Showing the help icon as a requester sees it')}
                disabled={!helpIcon}
                title={helpIcon ? 'View the icon' : 'Nothing attached yet'}
                className={`flex size-6 items-center justify-center rounded transition-colors ${
                  helpIcon ? 'text-[#64748B] hover:bg-white hover:text-[#364658]' : 'cursor-not-allowed text-[#C4CDD8]'
                }`}
              ><Eye size={13} /></button>
              <button
                onClick={() => { setHelpIcon(''); toast.success('Help icon removed'); }}
                disabled={!helpIcon}
                title={helpIcon ? 'Remove the icon' : 'Nothing attached yet'}
                className={`flex size-6 items-center justify-center rounded transition-colors ${
                  helpIcon ? 'text-[#64748B] hover:bg-[#FEF3F2] hover:text-[#EF4444]' : 'cursor-not-allowed text-[#C4CDD8]'
                }`}
              ><Trash2 size={13} /></button>
            </div>

            {/* ⚠️ Where help GOES is a different question from what it looks like, and the two
                answers are mutually exclusive — a link out to docs, or a file you host. The segment
                swaps the field rather than showing both, so there is never a filled URL sitting
                under an attachment that overrides it. */}
            <div className="mt-4">
              <Segmented
                value={helpKind}
                onChange={(x) => setHelpKind(x as 'url' | 'file')}
                options={[{ value: 'url', label: 'URL' }, { value: 'file', label: 'Attachment' }]}
              />
            </div>

            {helpKind === 'url' ? (
              <div className="mt-4">
                <p className="mb-1 text-[12px] text-[#7B8FA5]">URL <span className="text-[#EF4444]">*</span></p>
                <TextField
                  value={helpUrl}
                  onChange={setHelpUrl}
                  placeholder="https://docs.motadata.com/serviceops-docs/"
                />
                {/* Required, and said so BEFORE you save rather than after. */}
                {!helpUrl.trim() && (
                  <p className="mt-1.5 text-[11px] leading-[1.5] text-[#B54708]">
                    Help is on but has nowhere to go — requesters will see the icon and nothing will happen.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <p className="mb-1 text-[12px] text-[#7B8FA5]">Attachment <span className="text-[#EF4444]">*</span></p>
                <button
                  onClick={() => docRef.current?.click()}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded border border-dashed border-[#D9E0EA] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]"
                ><Upload size={14} /> {helpDoc || 'Upload a help document'}</button>
                <input
                  ref={docRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.html"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setHelpDoc(f.name);
                    toast.success(`${f.name} uploaded`);
                  }}
                />
              </div>
            )}
          </div>
        )}

        <Head>Sign-on</Head>
        <Field label="Identity Provider">
          <SelectField
            value={v.idp}
            onChange={(x) => set('idp', x)}
            options={['None — use ServiceOps login', 'Azure AD', 'Okta', 'Google Workspace', 'SAML 2.0']}
          />
        </Field>
        {/* ⚠️ Stated even while it cannot apply. The SSO-only switch is absent until a provider is
            chosen, and an absent control explains nothing — this says why it is missing and what
            brings it back, which is the difference between a rule and a dead end. */}
        <Note>
          Choose an identity provider before you can enforce SSO-only sign-in. Clearing the provider
          turns this back off, as it does in the product.
        </Note>

        <Head>Contact shown on the portal</Head>
        <Inherited
          label="Support Email"
          value={v.email}
          onChange={(x) => set('email', x)}
          placeholder="servicedesk@acme.com"
        />
        <Inherited
          label="Support Contact No."
          value={v.phone}
          onChange={(x) => set('phone', x)}
          placeholder="+91 79 4040 0000"
        />

        <Note>
          Helpdesk Name, Technician Portal Title and Login Screen Preference apply to the whole
          product and stay in <span className="font-medium text-[#364658]">Organization › Branding</span>.
        </Note>
      </div>

      {/* ⚠️ A STICKY footer, unlike the rest of the builder. Everything else on this canvas applies
          live, but branding reaches every login screen and every other portal — so it takes a
          deliberate Save rather than changing the product under someone who was only looking. */}
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
