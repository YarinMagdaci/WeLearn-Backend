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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLayoutByType = exports.editLayout = exports.createLayout = void 0;
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const layout_model_1 = __importDefault(require("../models/layout.model"));
const cloudinary_1 = __importDefault(require("cloudinary"));
// create layout
exports.createLayout = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.body;
        const isTypeExist = yield layout_model_1.default.findOne({ type });
        if (isTypeExist) {
            return next(new ErrorHandler_1.default(`${type} already exist`, 400));
        }
        // TODO: test Banner
        if (type === "Banner") {
            const { image, title, subTitle } = req.body;
            const myCloud = yield cloudinary_1.default.v2.uploader.upload(image, {
                folder: "layout",
            });
            const banner = {
                type: "Banner",
                banner: {
                    image: { public_id: myCloud.public_id, url: myCloud.secure_url },
                    title,
                    subTitle,
                },
            };
            yield layout_model_1.default.create(banner);
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            // imagine that each iteration we are making a blocking operation, like calling a third party API
            // we would want that to happen and while we are waiting
            // converting the type of each object:
            // Option A:
            //   const faqItems = await Promise.all(
            //     faq.map(async (item: any) => {
            //       return { question: item.question, answer: item.answer };
            //     })
            //   );
            // Option B:
            const faqItems = faq.map((item) => ({
                question: item.question,
                answer: item.answer,
            }));
            // we chose not to use Option C because IFaqItem extends Document and we don't need Document's field/s.
            // and we especially do not receive them at all.
            // Option A was valid aswell but not necessary to use Promises here.
            // Option C:
            //   const faqItems: IFaqItem[] = faq;
            yield layout_model_1.default.create({ type: "FAQ", faq: faqItems });
        }
        if (type === "Categories") {
            const { categories } = req.body;
            const categoriesItems = categories.map((item) => ({
                title: item.title,
            }));
            yield layout_model_1.default.create({
                type: "Categories",
                categories: categoriesItems,
            });
        }
        res
            .status(200)
            .json({ success: true, message: "Layout created successfully!" });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Edit layout
exports.editLayout = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.body;
        if (type === "Banner") {
            // extract banner data
            const bannerData = yield layout_model_1.default.findOne({ type: "Banner" });
            const { image, title, subTitle } = req.body;
            const data = image.startsWith("https")
                ? bannerData
                : yield cloudinary_1.default.v2.uploader.upload(image, { folder: "layout" });
            const banner = {
                type: "Banner",
                image: {
                    public_id: image.startsWith("https")
                        ? bannerData.banner.image.public_id
                        : data === null || data === void 0 ? void 0 : data.public_id,
                    url: image.startsWith("https")
                        ? bannerData.banner.image.url
                        : data === null || data === void 0 ? void 0 : data.secure_url,
                },
                title,
                subTitle,
            };
            yield layout_model_1.default.findByIdAndUpdate(bannerData._id, { banner });
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            const currentFaqItems = yield layout_model_1.default.findOne({ type: "FAQ" });
            const faqItems = faq.map((item) => ({
                question: item.question,
                answer: item.answer,
            }));
            yield layout_model_1.default.findByIdAndUpdate(currentFaqItems === null || currentFaqItems === void 0 ? void 0 : currentFaqItems._id, {
                type: "FAQ",
                faq: faqItems,
            });
        }
        if (type === "Categories") {
            const { categories } = req.body;
            const currentCategories = yield layout_model_1.default.findOne({
                type: "Categories",
            });
            const categoriesItems = categories.map((item) => ({
                title: item.title,
            }));
            yield layout_model_1.default.findByIdAndUpdate(currentCategories === null || currentCategories === void 0 ? void 0 : currentCategories._id, {
                type: "Categories",
                categories: categoriesItems,
            });
        }
        res
            .status(200)
            .json({ success: true, message: "Layout updated successfully" });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// get layout by type
exports.getLayoutByType = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const layout = yield layout_model_1.default.findOne({ type: req.params.type });
        res.status(201).json({ success: true, layout });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
