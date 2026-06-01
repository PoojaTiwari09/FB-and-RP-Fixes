interface SessionSidebarSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function SessionSidebarSection({
  title,
  children,
}: SessionSidebarSectionProps) {
  return (
    <div className="mb-5">
      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
        {title}
      </h4>
      <div>{children}</div>
    </div>
  );
}
