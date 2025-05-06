"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverStatus = exports.ReservationStatus = exports.TripStatus = void 0;
var TripStatus;
(function (TripStatus) {
    TripStatus["SCHEDULED"] = "SCHEDULED";
    TripStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TripStatus["COMPLETED"] = "COMPLETED";
    TripStatus["CANCELLED"] = "CANCELLED";
})(TripStatus || (exports.TripStatus = TripStatus = {}));
var ReservationStatus;
(function (ReservationStatus) {
    ReservationStatus["PENDING"] = "PENDING";
    ReservationStatus["CONFIRMED"] = "CONFIRMED";
    ReservationStatus["CANCELLED"] = "CANCELLED";
})(ReservationStatus || (exports.ReservationStatus = ReservationStatus = {}));
var DriverStatus;
(function (DriverStatus) {
    DriverStatus["ACTIVE"] = "ACTIVE";
    DriverStatus["OFFLINE"] = "OFFLINE";
})(DriverStatus || (exports.DriverStatus = DriverStatus = {}));
