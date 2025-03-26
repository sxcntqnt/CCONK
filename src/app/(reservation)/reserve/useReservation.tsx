import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSeats, getBuses, reserveSeats, resetReservations } from '@/lib/prisma/dbClient';
import { validatePhonePrefix, PHONE_VALIDATION_CONFIG } from '@/utils/constants/phone-constants';
import { initiateStkPush } from '@/lib/mpesa/stkpush';
import { toast } from 'sonner';

interface Bus {
  id: number;
  licensePlate: string;
  capacity: number;
}

interface SeatData {
  id: string;
  label: string;
  status: 'available' | 'selected' | 'reserved';
  price: number;
  row?: number;
  column?: number;
  category?: string; // Added
}

const useBusReservation = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [seats, setSeats] = useState<Record<string, SeatData>>({});
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState<string>('+254 ');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalBuses, setTotalBuses] = useState<number>(0);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false); // Declared here
  const pageSize = 10;

  const total = useMemo(() =>
    selectedSeats.reduce((sum, id) => sum + (seats[id]?.price || 0), 0),
    [selectedSeats, seats]
  );

  const fetchBuses = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const { buses: busData, total } = await getBuses(page, pageSize);
      if (busData.length === 0 && total === 0) {
        setError('No buses found in the system');
        toast.error('No buses available');
      } else {
        setBuses(busData);
        setTotalBuses(total);
        if (busData.length > 0 && !selectedBusId) {
          setSelectedBusId(busData[0].id);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load buses';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBusId]);

  useEffect(() => {
    fetchBuses(currentPage);
  }, [currentPage, fetchBuses]);

  const loadSeats = useCallback(async () => {
    if (selectedBusId === null) return;

    setIsLoading(true);
    setError(null);
    try {
      const seatData = await getSeats(selectedBusId);
      if (Object.keys(seatData).length === 0) {
        throw new Error('No seats available for this bus');
      }
      setSeats(seatData);
      setSelectedSeats([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch seats';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBusId]);

  useEffect(() => {
    loadSeats();
  }, [loadSeats]);

  const handleBusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBusId(parseInt(e.target.value, 10));
  };

  const handleSeatClick = (id: string) => {
    const seat = seats[id];
    if (!seat || seat.status === 'reserved') return;

    const newStatus = seat.status === 'available' ? 'selected' : 'available';
    setSeats(prevSeats => ({
      ...prevSeats,
      [id]: { ...seat, status: newStatus },
    }));
    setSelectedSeats(prev =>
      newStatus === 'selected' ? [...prev, id] : prev.filter(seatId => seatId !== id)
    );
  };

  const handleCheckout = async () => {
    if (selectedSeats.length === 0 || !selectedBusId) {
      toast.error('Please select a bus and at least one seat.');
      return;
    }

    if (phoneNumber === '+254 ' || phoneNumber.length <= 5) {
      toast.error('Please enter a valid phone number.');
      return;
    }

    setIsCheckoutModalOpen(true);
  };

    const confirmCheckout = async () => {
    const normalizedPhone = phoneNumber.trim().replace(/[\s,-]/g, '');
    const validationResult = validatePhonePrefix(normalizedPhone);

    if (!validationResult.isValid) {
      toast.error(validationResult.errorMessage || 'Please enter a valid phone number (e.g., +254 7XX...)');
      setIsCheckoutModalOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const paymentResult = await initiateStkPush({
        amount: total,
        phone: normalizedPhone,
      });

      if (paymentResult.ResponseCode !== '0') {
        throw new Error(paymentResult.ResponseDescription || 'Payment initiation failed');
      }

      const reservationResult = await reserveSeats(selectedSeats);
      if (!reservationResult.success) {
        throw new Error('Reservation failed');
      }

      setSeats(prev => {
        const updatedSeats = { ...prev };
        selectedSeats.forEach(id => {
          updatedSeats[id] = { ...updatedSeats[id], status: 'reserved' };
        });
        return updatedSeats;
      });

      setSelectedSeats([]);
      toast.success(`Payment initiated! Reserved ${reservationResult.reservedCount} seats.`);
      setIsCheckoutModalOpen(false); // Close on success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Checkout failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!selectedBusId) {
      toast.error('Please select a bus.');
      return;
    }
    if (!confirm('Are you sure you want to reset all reservations for this bus?')) return;

    setIsLoading(true);
    setError(null);
    try {
      const resetResult = await resetReservations(selectedBusId);
      if (!resetResult.success) throw new Error('Reset failed');
      await loadSeats();
      setSelectedSeats([]);
      setPhoneNumber('+254 ');
      toast.success(`Cleared ${resetResult.deletedCount} reservations successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage * pageSize < totalBuses) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return {
    buses,
    selectedBusId,
    seats,
    selectedSeats,
    total,
    phoneNumber,
    isLoading,
    error,
    setError,
    currentPage,
    totalPages: Math.ceil(totalBuses / pageSize),
    isCheckoutModalOpen, // Now defined and returned
    setIsCheckoutModalOpen,
    setPhoneNumber,
    handleBusChange,
    handleSeatClick,
    handleCheckout,
    confirmCheckout,
    handleReset,
    handleNextPage,
    handlePrevPage,
  };
};

export default useBusReservation;
