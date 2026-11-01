import {
  BellRing,
  BriefcaseBusiness,
  CircleHelp,
  CreditCard,
  Gift,
  Settings2,
  ShieldCheck,
  UsersRound,
  Video,
} from "lucide-react";
const icons = {
  customer: <UsersRound className="size-6" />,
  consultation: <Video className="size-6" />,
  support: <CircleHelp className="size-6" />,
  billing: <CreditCard className="size-6" />,
  referral: <Gift className="size-6" />,
  notification: <BellRing className="size-6" />,
  settings: <Settings2 className="size-6" />,
  team: <ShieldCheck className="size-6" />,
  default: <BriefcaseBusiness className="size-6" />,
};
const iconFor = (title: string) =>
  /customer/i.test(title)
    ? "customer"
    : /consult|call|refund/i.test(title)
      ? "consultation"
      : /ticket|support/i.test(title)
        ? "support"
        : /billing|payment/i.test(title)
          ? "billing"
          : /referral/i.test(title)
            ? "referral"
            : /notification|scheduled|message|activity/i.test(title)
              ? "notification"
              : /setting|engine|integration|pricing|service/i.test(title)
                ? "settings"
                : /role|department|categor|user|team/i.test(title)
                  ? "team"
                  : "default";
export function PageIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="page-intro mb-6 flex items-center gap-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-blue-100 bg-white text-brand shadow-sm">
        {icons[iconFor(title)]}
      </span>
      <div>
        <h1 className="font-semibold text-ink">{title}</h1>
        <p className="mt-1 text-[13px] leading-5 text-ink-muted">
          {description}
        </p>
      </div>
    </div>
  );
}
