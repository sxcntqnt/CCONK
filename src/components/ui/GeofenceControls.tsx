import React, { useState } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, MapIcon, SearchIcon } from 'lucide-react';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';

interface Geofence {
    id: string;
    name: string;
    description?: string;
    geoJson: any;
    color: string;
    createdAt: Date;
}

interface GeofenceControlsProps {
    geofences: Geofence[];
    activeGeofence: string | null;
    setActiveGeofence: (id: string | null) => void;
    editMode: boolean;
    setEditMode: (mode: boolean) => void;
    onNameChange: (id: string, name: string) => void;
    onDelete: (id: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    startDrawing: (mode: 'draw_rectangle' | 'draw_polygon') => void;
}

const GeofenceControls: React.FC<GeofenceControlsProps> = ({
    geofences,
    activeGeofence,
    setActiveGeofence,
    editMode,
    setEditMode,
    onNameChange,
    onDelete,
    searchQuery,
    setSearchQuery,
    startDrawing,
}) => {
    const [editingName, setEditingName] = useState<string | null>(null);
    const [nameInput, setNameInput] = useState<string>('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleEditName = (geofence: Geofence) => {
        setEditingName(geofence.id);
        setNameInput(geofence.name);
    };

    const handleSaveName = (id: string) => {
        if (nameInput.trim()) {
            onNameChange(id, nameInput);
            setEditingName(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingName(null);
    };

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = () => {
        if (deleteConfirmId) {
            onDelete(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };

    return (
        <div className="w-full md:w-1/4 p-4 bg-background border-l border-border overflow-y-auto">
            <div className="mb-6">
                <h2 className="text-xl font-bold mb-2 flex items-center">
                    <MapIcon className="mr-2" size={20} />
                    Geofence Manager
                </h2>
                <p className="text-sm text-muted-foreground">
                    Create and manage your geofences. Use the drawing tools below or on the map.
                </p>
            </div>
            <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                    type="text"
                    placeholder="Search geofences..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
            </div>
            <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Your Geofences</h3>
                    <Button variant="ghost" size="sm" onClick={() => setEditMode(!editMode)} className="text-sm">
                        <PencilIcon size={14} className="mr-1" />
                        {editMode ? 'Done' : 'Edit All'}
                    </Button>
                </div>
                {geofences.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <MapIcon size={40} className="mx-auto mb-2 opacity-30" />
                        <p>{searchQuery ? 'No matching geofences' : 'No geofences created yet'}</p>
                        {!searchQuery && (
                            <p className="text-sm mt-2">Use the drawing tools below to create a geofence</p>
                        )}
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {geofences.map((geofence) => (
                            <li
                                key={geofence.id}
                                className={`p-3 rounded-lg border transition-all duration-200 ${activeGeofence === geofence.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                            >
                                <div className="flex items-center">
                                    <div
                                        className="w-4 h-4 rounded-full mr-3 border border-border"
                                        style={{
                                            backgroundColor: geofence.color,
                                        }}
                                    />
                                    <div className="flex-1">
                                        {editingName === geofence.id ? (
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="text"
                                                    value={nameInput}
                                                    onChange={(e) => setNameInput(e.target.value)}
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                    autoFocus
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSaveName(geofence.id)}
                                                >
                                                    Save
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <div
                                                    className="font-medium cursor-pointer"
                                                    onClick={() => setActiveGeofence(geofence.id)}
                                                >
                                                    {geofence.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Created {geofence.createdAt.toLocaleDateString()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {(editMode || activeGeofence === geofence.id) && (
                                        <div className="flex space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleEditName(geofence)}
                                            >
                                                <PencilIcon size={14} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => handleDeleteClick(geofence.id)}
                                            >
                                                <TrashIcon size={14} />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="mt-6">
                    <p className="text-sm text-muted-foreground mb-2">Drawing Tools</p>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-sm"
                            onClick={() => startDrawing('draw_rectangle')}
                            disabled={!editMode}
                        >
                            <PlusIcon size={14} className="mr-1" />
                            Rectangle
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-sm"
                            onClick={() => startDrawing('draw_polygon')}
                            disabled={!editMode}
                        >
                            <PlusIcon size={14} className="mr-1" />
                            Polygon
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Enable edit mode to use drawing tools or edit existing geofences on the map
                    </p>
                </div>
            </div>
            <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Geofence</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this geofence? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GeofenceControls;
