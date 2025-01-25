export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-5xl w-full px-5 flex flex-col gap-12 items-start">{children}</div>
  );
}
