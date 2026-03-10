import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-200 py-8 mt-auto">
      <div className="page-container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍽️</span>
            <span className="font-display font-bold text-white">SmartCanteen</span>
          </div>
          <p className="text-sm text-secondary-300">
            © {new Date().getFullYear()} Smart Canteen System · College Food Ordering Made Easy
          </p>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/menu"  className="hover:text-white transition-colors">Menu</Link>
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
