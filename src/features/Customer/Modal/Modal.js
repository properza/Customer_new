// src/components/Modal.js
import React from 'react';
import PropTypes from 'prop-types';
import { Transition } from '@headlessui/react'; // Install headlessui for transitions

const Modal = ({ isOpen, onClose, children }) => {
  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <Transition.Child
          as={React.Fragment}
          enter="transition ease-out duration-300 transform"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition ease-in duration-200 transform"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-80 max-w-full">
            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={onClose}
              aria-label="Close Modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                   viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Modal Body */}
            {children}
          </div>
        </Transition.Child>
      </div>
    </Transition>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,    
  onClose: PropTypes.func.isRequired,   
  children: PropTypes.node,             
};

export default Modal;
