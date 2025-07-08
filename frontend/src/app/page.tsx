"use client"

import { useEffect, useRef } from "react"
import { Building2, Search, MapPin, Star, Users, TrendingUp } from "lucide-react"

export default function Home() {
  const heroRef = useRef<HTMLElement>(null)
  const featuresRef = useRef<HTMLElement>(null)
  const statsRef = useRef<HTMLElement>(null)
  const ctaRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in")
        }
      })
    }, observerOptions)

    const elements = [featuresRef.current, statsRef.current, ctaRef.current]
    elements.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-black">
      {/* Hero Section */}
      <main ref={heroRef} className="hero-animate px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            {/* Logo/Brand */}
            <div className="flex items-center justify-center mb-8 hero-logo">
              <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400 mr-3" />
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white">Trompo</h1>
            </div>

            {/* Hero Headline */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-800 dark:text-gray-200 mb-6 hero-headline">
              Discover Amazing Local Businesses
              <span className="block text-blue-600 dark:text-blue-400 mt-2">Across the Philippines</span>
            </h2>

            {/* Hero Description */}
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto hero-description">
              Connect with authentic Filipino businesses in your neighborhood. From traditional sari-sari stores to
              modern cafes, find the best local gems that make our communities special.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center hero-buttons">
              <button className="btn-primary group">
                <Search className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                Explore Businesses
              </button>
              <button className="btn-secondary group">
                <Building2 className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                List Your Business
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 px-4 sm:px-6 lg:px-8 scroll-animate">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Why Choose Trompo?</h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We're more than just a directory - we're your gateway to authentic Filipino business experiences
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="feature-card group">
              <div className="feature-icon bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white">
                <MapPin className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Local Focus</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Discover businesses in your barangay and support your local community with every purchase.
              </p>
            </div>

            <div className="feature-card group">
              <div className="feature-icon bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:bg-green-600 group-hover:text-white">
                <Star className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Verified Reviews</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Read authentic reviews from fellow Filipinos to make informed decisions about where to shop and dine.
              </p>
            </div>

            <div className="feature-card group">
              <div className="feature-icon bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white">
                <Users className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Community Driven</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Built by Filipinos, for Filipinos. Join a community that celebrates local entrepreneurship.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 scroll-animate">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="stat-item">
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">1,000+</div>
              <div className="text-gray-600 dark:text-gray-300">Local Businesses</div>
            </div>
            <div className="stat-item">
              <div className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400 mb-2">50+</div>
              <div className="text-gray-600 dark:text-gray-300">Cities Covered</div>
            </div>
            <div className="stat-item">
              <div className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">5,000+</div>
              <div className="text-gray-600 dark:text-gray-300">Happy Customers</div>
            </div>
            <div className="stat-item">
              <div className="text-3xl sm:text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">4.8★</div>
              <div className="text-gray-600 dark:text-gray-300">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={ctaRef}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-green-600 dark:from-blue-800 dark:to-green-800 scroll-animate"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Discover Your Next Favorite Local Spot?
          </h3>
          <p className="text-xl text-blue-100 dark:text-blue-200 mb-8">
            Join thousands of Filipinos who trust Trompo to find the best local businesses in their area.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-white group">
              <TrendingUp className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              Get Started Today
            </button>
            <button className="btn-outline-white">Learn More</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Building2 className="h-8 w-8 text-blue-400 mr-2" />
                <span className="text-xl font-bold">Trompo</span>
              </div>
              <p className="text-gray-400 dark:text-gray-500">Connecting Filipino communities through local business discovery.</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Customers</h4>
              <ul className="space-y-2 text-gray-400 dark:text-gray-500">
                <li>
                  <a href="#" className="hover:text-white dark:hover:text-gray-300 transition-colors">
                    Find Businesses
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white dark:hover:text-gray-300 transition-colors">
                    Write Reviews
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white dark:hover:text-gray-300 transition-colors">
                    Mobile App
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Businesses</h4>
              <ul className="space-y-2 text-gray-400 dark:text-gray-500">
                <li>
                  <a href="#" className="hover:text-white dark:hover:text-gray-300 transition-colors">
                    List Your Business
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white dark:hover:text-gray-300 transition-colors">
                    Business Tools
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white dark:hover:text-gray-300 transition-colors">
                    Success Stories
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 dark:text-gray-500">
                <li>
                  <a href="#" className="hover:text-white dark:hover:text-gray-300 transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white dark:hover:text-gray-300 transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white dark:hover:text-gray-300 transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 dark:border-gray-700 mt-8 pt-8 text-center text-gray-400 dark:text-gray-500">
            <p>&copy; 2024 Trompo. Made with ❤️ for Filipino communities.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
