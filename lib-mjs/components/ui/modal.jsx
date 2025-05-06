'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useMediaQuery } from 'usehooks-ts';
import { Dialog } from './dialog';
import { Drawer } from './drawer';
const Modal = ({ children, isOpen, setIsOpen, onClose }) => {
    const router = useRouter();
    const handleClose = ({ dragged }) => {
        onClose && onClose();
        if (isOpen) {
            setIsOpen(false);
        }
        else {
            router.back();
        }
    };
    const isDesktop = useMediaQuery('(max-width: 768px)');
    if (isDesktop) {
        return (<Dialog open={isOpen} onOpenChange={setIsOpen}>
                {children}
            </Dialog>);
    }
    return (<Drawer open={isOpen} onOpenChange={setIsOpen} direction="bottom">
            {children}
        </Drawer>);
};
export default Modal;
