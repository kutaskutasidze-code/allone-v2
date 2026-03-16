export default function WorkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden relative">{children}</div>
  );
}
