"use strict";
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
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const button_1 = require("./button");
const dialog_1 = require("./dialog");
const GeofenceControls = ({ geofences, activeGeofence, setActiveGeofence, editMode, setEditMode, onNameChange, onDelete, searchQuery, setSearchQuery, startDrawing, }) => {
    const [editingName, setEditingName] = (0, react_1.useState)(null);
    const [nameInput, setNameInput] = (0, react_1.useState)('');
    const [deleteConfirmId, setDeleteConfirmId] = (0, react_1.useState)(null);
    const handleEditName = (geofence) => {
        setEditingName(geofence.id);
        setNameInput(geofence.name);
    };
    const handleSaveName = (id) => {
        if (nameInput.trim()) {
            onNameChange(id, nameInput);
            setEditingName(null);
        }
    };
    const handleCancelEdit = () => {
        setEditingName(null);
    };
    const handleDeleteClick = (id) => {
        setDeleteConfirmId(id);
    };
    const confirmDelete = () => {
        if (deleteConfirmId) {
            onDelete(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };
    return (<div className="w-full md:w-1/4 p-4 bg-background border-l border-border overflow-y-auto">
            <div className="mb-6">
                <h2 className="text-xl font-bold mb-2 flex items-center">
                    <lucide_react_1.MapIcon className="mr-2" size={20}/>
                    Geofence Manager
                </h2>
                <p className="text-sm text-muted-foreground">
                    Create and manage your geofences. Use the drawing tools below or on the map.
                </p>
            </div>
            <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <lucide_react_1.SearchIcon className="h-4 w-4 text-muted-foreground"/>
                </div>
                <input type="text" placeholder="Search geofences..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"/>
            </div>
            <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Your Geofences</h3>
                    <button_1.Button variant="ghost" size="sm" onClick={() => setEditMode(!editMode)} className="text-sm">
                        <lucide_react_1.PencilIcon size={14} className="mr-1"/>
                        {editMode ? 'Done' : 'Edit All'}
                    </button_1.Button>
                </div>
                {geofences.length === 0 ? (<div className="text-center py-8 text-muted-foreground">
                        <lucide_react_1.MapIcon size={40} className="mx-auto mb-2 opacity-30"/>
                        <p>{searchQuery ? 'No matching geofences' : 'No geofences created yet'}</p>
                        {!searchQuery && (<p className="text-sm mt-2">Use the drawing tools below to create a geofence</p>)}
                    </div>) : (<ul className="space-y-2">
                        {geofences.map((geofence) => (<li key={geofence.id} className={`p-3 rounded-lg border transition-all duration-200 ${activeGeofence === geofence.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                <div className="flex items-center">
                                    <div className="w-4 h-4 rounded-full mr-3 border border-border" style={{
                    backgroundColor: geofence.color,
                }}/>
                                    <div className="flex-1">
                                        {editingName === geofence.id ? (<div className="flex items-center space-x-2">
                                                <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" autoFocus/>
                                                <button_1.Button variant="ghost" size="sm" onClick={() => handleSaveName(geofence.id)}>
                                                    Save
                                                </button_1.Button>
                                                <button_1.Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                                                    Cancel
                                                </button_1.Button>
                                            </div>) : (<div className="space-y-1">
                                                <div className="font-medium cursor-pointer" onClick={() => setActiveGeofence(geofence.id)}>
                                                    {geofence.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Created {geofence.createdAt.toLocaleDateString()}
                                                </div>
                                            </div>)}
                                    </div>
                                    {(editMode || activeGeofence === geofence.id) && (<div className="flex space-x-2">
                                            <button_1.Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditName(geofence)}>
                                                <lucide_react_1.PencilIcon size={14}/>
                                            </button_1.Button>
                                            <button_1.Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteClick(geofence.id)}>
                                                <lucide_react_1.TrashIcon size={14}/>
                                            </button_1.Button>
                                        </div>)}
                                </div>
                            </li>))}
                    </ul>)}
                <div className="mt-6">
                    <p className="text-sm text-muted-foreground mb-2">Drawing Tools</p>
                    <div className="flex space-x-2">
                        <button_1.Button variant="outline" size="sm" className="text-sm" onClick={() => startDrawing('draw_rectangle')} disabled={!editMode}>
                            <lucide_react_1.PlusIcon size={14} className="mr-1"/>
                            Rectangle
                        </button_1.Button>
                        <button_1.Button variant="outline" size="sm" className="text-sm" onClick={() => startDrawing('draw_polygon')} disabled={!editMode}>
                            <lucide_react_1.PlusIcon size={14} className="mr-1"/>
                            Polygon
                        </button_1.Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Enable edit mode to use drawing tools or edit existing geofences on the map
                    </p>
                </div>
            </div>
            <dialog_1.Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
                <dialog_1.DialogContent>
                    <dialog_1.DialogHeader>
                        <dialog_1.DialogTitle>Delete Geofence</dialog_1.DialogTitle>
                        <dialog_1.DialogDescription>
                            Are you sure you want to delete this geofence? This action cannot be undone.
                        </dialog_1.DialogDescription>
                    </dialog_1.DialogHeader>
                    <dialog_1.DialogFooter>
                        <button_1.Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
                            Cancel
                        </button_1.Button>
                        <button_1.Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </button_1.Button>
                    </dialog_1.DialogFooter>
                </dialog_1.DialogContent>
            </dialog_1.Dialog>
        </div>);
};
exports.default = GeofenceControls;
