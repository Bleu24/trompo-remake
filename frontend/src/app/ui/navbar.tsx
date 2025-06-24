'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 dark:bg-gray-900/80 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">T</span>
                            </div>
                            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                                Trompo
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-8">
                            <Link
                                href="/"
                                className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400"
                            >
                                Home
                            </Link>
                            <Link
                                href="/dashboard"
                                className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400"
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/products"
                                className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400"
                            >
                                Products
                            </Link>
                            <Link
                                href="/about"
                                className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400"
                            >
                                About
                            </Link>
                        </div>
                    </div>

                    {/* Right side buttons */}
                    <div className="hidden md:block">
                        <div className="ml-4 flex items-center space-x-4">
                            <button className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                            <Link
                                href="/login"
                                className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/signup"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                            >
                                Sign Up
                            </Link>
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                            <Link
                                href="/"
                                className="block text-gray-900 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
                                onClick={() => setIsOpen(false)}
                            >
                                Home
                            </Link>
                            <Link
                                href="/dashboard"
                                className="block text-gray-900 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
                                onClick={() => setIsOpen(false)}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/products"
                                className="block text-gray-900 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
                                onClick={() => setIsOpen(false)}
                            >
                                Products
                            </Link>
                            <Link
                                href="/about"
                                className="block text-gray-900 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
                                onClick={() => setIsOpen(false)}
                            >
                                About
                            </Link>
                            <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                                <Link
                                    href="/login"
                                    className="block text-gray-900 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/signup"
                                    className="block bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 mt-2 text-base font-medium rounded-lg transition-colors duration-200"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Sign Up
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}