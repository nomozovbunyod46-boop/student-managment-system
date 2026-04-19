import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white/80 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-slate-900 font-semibold">NomozovEvent</p>
            <p className="text-slate-600 text-sm">Discover, join, and manage events with confidence.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <Link to="/" className="hover:text-indigo-600">Home</Link>
            <Link to="/events" className="hover:text-indigo-600">Events</Link>
            <Link to="/support" className="hover:text-indigo-600">Support</Link>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>Social</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <a href="#" className="hover:text-indigo-600">Twitter</a>
            <a href="#" className="hover:text-indigo-600">LinkedIn</a>
            <a href="#" className="hover:text-indigo-600">Facebook</a>
          </div>
        </div>
        <div className="mt-6 text-xs text-slate-500">
          © {new Date().getFullYear()} NomozovEvent. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
