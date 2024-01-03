"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLastTwelveMonthData = void 0;
function generateLastTwelveMonthData(model) {
    return __awaiter(this, void 0, void 0, function* () {
        // create an array which will represent last 12 months analytics
        const lastTwelveMonths = [];
        // generate now date of now
        const currentDate = new Date();
        // go one day forward - tomorrow
        currentDate.setDate(currentDate.getDate() + 1);
        // run on for loop for 12 times
        for (let i = 11; i >= 0; --i) {
            // date ctr:
            // new Date(year, monthIndex, day)
            // endDate -> from today go backwards: months_idx * 28 days
            const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i * 28);
            // startDate -> from endDate go backwards: 28 days
            const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 28);
            // from startDate to endDate is currentMonth we are treating to
            // monthYear is the month string we are going to insert to the array
            const monthYear = endDate.toLocaleString("default", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
            // count is the result of how many records are bigger or equal than 'startDate' and less than 'endDate'
            // such that each record is from the model we sent, it could be userModel, it could be courseModel, even notificationsModel
            const count = yield model.countDocuments({
                createdAt: { $gte: startDate, $lt: endDate },
            });
            // add in the end of each iteration new month analytic to the array of analytics of last twelve months
            lastTwelveMonths.push({ month: monthYear, count });
        }
        return { lastTwelveMonths };
    });
}
exports.generateLastTwelveMonthData = generateLastTwelveMonthData;
