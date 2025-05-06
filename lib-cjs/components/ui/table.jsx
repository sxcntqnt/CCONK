"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = Table;
exports.TableHeader = TableHeader;
exports.TableBody = TableBody;
exports.TableFooter = TableFooter;
exports.TableHead = TableHead;
exports.TableRow = TableRow;
exports.TableCell = TableCell;
exports.TableCaption = TableCaption;
const React = __importStar(require("react"));
const utils_1 = require("@/utils");
function Table({ className, ...props }) {
    return (<div data-slot="table-container" className="relative w-full overflow-x-auto">
            <table data-slot="table" className={(0, utils_1.cn)('w-full caption-bottom text-sm', className)} {...props}/>
        </div>);
}
function TableHeader({ className, ...props }) {
    return <thead data-slot="table-header" className={(0, utils_1.cn)('[&_tr]:border-b', className)} {...props}/>;
}
function TableBody({ className, ...props }) {
    return <tbody data-slot="table-body" className={(0, utils_1.cn)('[&_tr:last-child]:border-0', className)} {...props}/>;
}
function TableFooter({ className, ...props }) {
    return (<tfoot data-slot="table-footer" className={(0, utils_1.cn)('bg-muted/50 border-t font-medium [&>tr]:last:border-b-0', className)} {...props}/>);
}
function TableRow({ className, ...props }) {
    return (<tr data-slot="table-row" className={(0, utils_1.cn)('hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors', className)} {...props}/>);
}
function TableHead({ className, ...props }) {
    return (<th data-slot="table-head" className={(0, utils_1.cn)('text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]', className)} {...props}/>);
}
function TableCell({ className, ...props }) {
    return (<td data-slot="table-cell" className={(0, utils_1.cn)('p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]', className)} {...props}/>);
}
function TableCaption({ className, ...props }) {
    return (<caption data-slot="table-caption" className={(0, utils_1.cn)('text-muted-foreground mt-4 text-sm', className)} {...props}/>);
}
