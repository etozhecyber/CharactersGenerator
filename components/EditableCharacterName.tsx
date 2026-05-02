
import React, { useState, useEffect, useRef } from 'react';

interface EditableCharacterNameProps {
    name: string;
    onNameChange: (newName: string) => void;
}

export const EditableCharacterName: React.FC<EditableCharacterNameProps> = ({ name, onNameChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentName, setCurrentName] = useState(name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCurrentName(name);
    }, [name]);
    
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (currentName.trim() && currentName.trim() !== name) {
            onNameChange(currentName.trim());
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setCurrentName(name);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="text-2xl sm:text-3xl font-bold text-white bg-transparent border-b-2 border-indigo-500 focus:outline-none w-full"
                aria-label="Edit character name"
            />
        );
    }

    return (
        <h2 
            className="text-2xl sm:text-3xl font-bold text-white truncate cursor-pointer"
            onClick={() => setIsEditing(true)}
            title="Click to edit name"
        >
            {name}
        </h2>
    );
};
