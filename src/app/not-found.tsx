import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-6">
        <h1 className="text-[120px] font-bold text-black leading-none tracking-tight">
          404
        </h1>
        <p className="text-xl text-gray-600 mt-4 mb-8">
          This page doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-black font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Contact Us
          </Link>
        </div>
        <div className="mt-12 text-sm text-gray-400">
          <p>Looking for something specific?</p>
          <div className="flex gap-6 justify-center mt-4">
            <Link href="/projects" className="hover:text-black transition-colors">
              Projects
            </Link>
            <Link href="/about" className="hover:text-black transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-black transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
