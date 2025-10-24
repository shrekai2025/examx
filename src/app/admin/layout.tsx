import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex space-x-8">
              <Link
                href="/admin"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-indigo-600"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/vocabularies"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Vocabularies
              </Link>
              <Link
                href="/admin/target-vocabularies"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Target Vocabularies
              </Link>
              <Link
                href="/admin/settings"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Settings
              </Link>
              <Link
                href="/admin/image-generation"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Image Generation
              </Link>
              <Link
                href="/admin/audio-generation"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Audio Generation
              </Link>
            </div>
            <div className="flex items-center">
              <Link
                href="/"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
              >
                Go to Learning
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
