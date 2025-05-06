export var TripStatus;
(function (TripStatus) {
    TripStatus["SCHEDULED"] = "SCHEDULED";
    TripStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TripStatus["COMPLETED"] = "COMPLETED";
    TripStatus["CANCELLED"] = "CANCELLED";
})(TripStatus || (TripStatus = {}));
export var ReservationStatus;
(function (ReservationStatus) {
    ReservationStatus["PENDING"] = "PENDING";
    ReservationStatus["CONFIRMED"] = "CONFIRMED";
    ReservationStatus["CANCELLED"] = "CANCELLED";
})(ReservationStatus || (ReservationStatus = {}));
export var DriverStatus;
(function (DriverStatus) {
    DriverStatus["ACTIVE"] = "ACTIVE";
    DriverStatus["OFFLINE"] = "OFFLINE";
})(DriverStatus || (DriverStatus = {}));
