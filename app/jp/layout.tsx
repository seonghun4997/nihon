import TabBar from '@/components/TabBar';

export default function JpLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="wrap">{children}</div>
      <TabBar />
    </>
  );
}
