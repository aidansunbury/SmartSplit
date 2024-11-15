import Link from "next/link";

import { getServerAuthSession } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

import { BarChart2, CreditCard, Receipt, Users } from "lucide-react";
import { SignInButton } from "~/components/SigninButton";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default async function Home() {
  const session = await getServerAuthSession();

  return (
    <HydrateClient>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <header className="container mx-auto px-4 py-8">
          <h1 className="font-bold text-4xl text-gray-900">Smart Split</h1>
        </header>

        <main className="container mx-auto px-4">
          <section className="mb-16 text-center">
            <h2 className="mb-4 font-semibold text-3xl text-gray-800">
              Simplify Group Expenses
            </h2>
            <p className="mb-8 text-gray-600 text-xl">
              Split bills, track expenses, and settle up with friends and
              roommates effortlessly.
            </p>
            <div className="flex justify-center">
              <div className="w-full max-w-md space-y-4">
                {session ? (
                  <Button asChild>
                    <Link href="/dashboard">Go To Dashboard</Link>
                  </Button>
                ) : (
                  <SignInButton redirect="/dashboard" />
                )}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-8">
            <Card className="hover:-translate-y-1 transform bg-green-50 transition-all duration-300 ease-in-out hover:bg-green-100 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-green-700">
                  <Users className="mr-2" />
                  Create Groups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-600">
                  Easily organize expenses with friends, roommates, or for
                  trips.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:-translate-y-1 transform bg-blue-50 transition-all duration-300 ease-in-out hover:bg-blue-100 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-700">
                  <BarChart2 className="mr-2" />
                  Track Balances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-600">
                  See who owes what at a glance with real-time balance updates.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:-translate-y-1 transform bg-purple-50 transition-all duration-300 ease-in-out hover:bg-purple-100 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-700">
                  <Receipt className="mr-2" />
                  Organize Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-600">
                  Categorize and manage all your shared expenses in one place.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:-translate-y-1 transform bg-orange-50 transition-all duration-300 ease-in-out hover:bg-orange-100 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-700">
                  <CreditCard className="mr-2" />
                  Record Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-orange-600">
                  Keep track of settlements and payments within the app.
                </p>
              </CardContent>
            </Card>
          </section>
        </main>

        <footer className="container mx-auto mt-16 px-4 py-8 text-center text-gray-600">
          Built as a final project for 61d.
        </footer>
      </div>
    </HydrateClient>
  );
}
