import Navbar from '@/components/layout/Navbar'
import ClientLayout from '@/components/layout/ClientLayout'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <ClientLayout>
        <main className="flex-1 w-full pb-20 md:pb-0">{children}</main>
      </ClientLayout>
    </div>
  )
}
