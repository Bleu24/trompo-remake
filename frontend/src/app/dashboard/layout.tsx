import { Inter } from "next/font/google";

const inter = Inter({
    subsets: ['latin']
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <html>
            <body className={`${inter.className}`}>
                {children}
            </body>
        </html>
    );
}