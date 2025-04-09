// src/app/(main)/dashboard/owner/clientOwnerDashboard.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components';
import { getNavItemsByRole } from '@/components/config';
import { Role } from '@/utils/constants/roles';

export default function ClientOwnerDashboard({
    user,
    trips,
    buses,
    drivers,
    reservations,
    incomeExpenses,
    geofences,
    reports,
    users,
    role,
}: {
    user: any; // Replace with proper Clerk User type if available
    trips: any[];
    buses: any[];
    drivers: any[];
    reservations: any[];
    incomeExpenses: any[];
    geofences: any[];
    reports: any[];
    users: any[];
    role: Role;
}) {
    const router = useRouter();

    return (
        <div className="flex">
            {/* Sidebar */}
            <AppSidebar role={role} />

            {/* Main Dashboard */}
            <div className="flex-1 container mx-auto py-8">
                <h1 className="text-3xl font-bold mb-6">Owner Dashboard</h1>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Active Trips */}
                    <div className="max-w-sm">
                        <div className="rounded-lg overflow-hidden shadow-lg bg-white">
                            <div className="p-4">
                                <h2 className="text-xl font-semibold mb-2">Active Trips</h2>
                                <div className="text-sm text-gray-600 mb-4">Manage your active trips here.</div>
                                <div className="space-y-2">
                                    {trips.length > 0 ? (
                                        trips.map((trip) => (
                                            <div key={trip.id} className="border-b pb-2 mb-2">
                                                <strong>Trip #{trip.id}</strong>
                                                <p>
                                                    {trip.departureCity} → {trip.arrivalCity}
                                                </p>
                                                <p className="text-gray-500">
                                                    {new Date(trip.departureTime).toLocaleString()}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No active trips at the moment.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Buses */}
                    <div className="max-w-sm">
                        <div className="rounded-lg overflow-hidden shadow-lg bg-white">
                            <div className="p-4">
                                <h2 className="text-xl font-semibold mb-2">Buses</h2>
                                <div className="text-sm text-gray-600 mb-4">Check the details of all buses.</div>
                                <div className="space-y-2">
                                    {buses.length > 0 ? (
                                        buses.map((bus) => (
                                            <div key={bus.id} className="border-b pb-2 mb-2">
                                                <strong>{bus.licensePlate}</strong>
                                                <p>Capacity: {bus.capacity}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No buses registered.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Drivers */}
                    <div className="max-w-sm">
                        <div className="rounded-lg overflow-hidden shadow-lg bg-white">
                            <div className="p-4">
                                <h2 className="text-xl font-semibold mb-2">Drivers</h2>
                                <div className="text-sm text-gray-600 mb-4">View all available drivers.</div>
                                <div className="space-y-2">
                                    {drivers.length > 0 ? (
                                        drivers.map((driver) => (
                                            <div key={driver.id} className="border-b pb-2 mb-2">
                                                <strong>{driver.name}</strong>
                                                <p>{driver.license}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No drivers available.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reservations */}
                    <div className="max-w-sm">
                        <div className="rounded-lg overflow-hidden shadow-lg bg-white">
                            <div className="p-4">
                                <h2 className="text-xl font-semibold mb-2">Reservations</h2>
                                <div className="text-sm text-gray-600 mb-4">View and manage all reservations.</div>
                                <div className="space-y-2">
                                    {reservations.length > 0 ? (
                                        reservations.map((reservation) => (
                                            <div key={reservation.id} className="border-b pb-2 mb-2">
                                                <strong>Reservation #{reservation.id}</strong>
                                                <p>{reservation.customerName}</p>
                                                <p className="text-gray-500">
                                                    {new Date(reservation.date).toLocaleString()}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No reservations at the moment.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Income & Expenses */}
                    <div className="max-w-sm">
                        <div className="rounded-lg overflow-hidden shadow-lg bg-white">
                            <div className="p-4">
                                <h2 className="text-xl font-semibold mb-2">Income & Expenses</h2>
                                <div className="text-sm text-gray-600 mb-4">
                                    Track income and expenses for your business.
                                </div>
                                <div className="space-y-2">
                                    {incomeExpenses.length > 0 ? (
                                        incomeExpenses.map((entry) => (
                                            <div key={entry.id} className="border-b pb-2 mb-2">
                                                <strong>{entry.type}</strong>
                                                <p>Amount: ${entry.amount}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No income or expenses recorded.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Geofences */}
                    <div className="max-w-sm">
                        <div className="rounded-lg overflow-hidden shadow-lg bg-white">
                            <div className="p-4">
                                <h2 className="text-xl font-semibold mb-2">Geofences</h2>
                                <div className="text-sm text-gray-600 mb-4">
                                    Set and manage geofences for the buses.
                                </div>
                                <div className="space-y-2">
                                    {geofences.length > 0 ? (
                                        geofences.map((geofence) => (
                                            <div key={geofence.id} className="border-b pb-2 mb-2">
                                                <strong>{geofence.name}</strong>
                                                <p>{geofence.area}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No geofences set up.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reports */}
                    <div className="max-w-sm">
                        <div className="rounded-lg overflow-hidden shadow-lg bg-white">
                            <div className="p-4">
                                <h2 className="text-xl font-semibold mb-2">Reports</h2>
                                <div className="text-sm text-gray-600 mb-4">
                                    Generate and view reports on various metrics.
                                </div>
                                <div className="space-y-2">
                                    {reports.length > 0 ? (
                                        reports.map((report) => (
                                            <div key={report.id} className="border-b pb-2 mb-2">
                                                <strong>{report.title}</strong>
                                                <p>{report.description}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No reports generated.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Users */}
                    <div className="max-w-sm">
                        <div className="rounded-lg overflow-hidden shadow-lg bg-white">
                            <div className="p-4">
                                <h2 className="text-xl font-semibold mb-2">Users</h2>
                                <div className="text-sm text-gray-600 mb-4">Manage users and their roles.</div>
                                <div className="space-y-2">
                                    {users.length > 0 ? (
                                        users.map((user) => (
                                            <div key={user.id} className="border-b pb-2 mb-2">
                                                <strong>{user.name}</strong>
                                                <p>{user.role}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No users found.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="max-w-sm">
                        <div className="rounded-lg overflow-hidden shadow-lg bg-white">
                            <div className="p-4">
                                <h2 className="text-xl font-semibold mb-2">Settings</h2>
                                <div className="text-sm text-gray-600 mb-4">Modify application settings.</div>
                                <div className="space-y-2">
                                    <Button onClick={() => router.push('/settings')}>Go to Settings</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
