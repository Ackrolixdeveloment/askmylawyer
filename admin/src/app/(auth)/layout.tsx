import Image from "next/image";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid h-full place-items-center overflow-y-auto bg-canvas px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-7 flex items-center justify-center gap-3">
          <Image
            src="/logo.png"
            alt=""
            width={68}
            height={72}
            className="h-14 w-auto"
            priority
          />
          <span className="text-xl font-semibold tracking-wide text-sidebar-fg">
            ASK MY LAWYER
          </span>
        </div>

        {children}
      </div>
    </div>
  );
}