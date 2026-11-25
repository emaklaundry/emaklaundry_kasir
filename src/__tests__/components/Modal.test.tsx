import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Modal from '@/components/Modal';

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');
const showModalMock = vi.fn(function (this: HTMLDialogElement) {
  this.setAttribute('open', '');
});
const closeMock = vi.fn(function (this: HTMLDialogElement) {
  this.removeAttribute('open');
  this.dispatchEvent(new Event('close'));
});

describe('Modal', () => {
  beforeEach(() => {
    showModalMock.mockClear();
    closeMock.mockClear();
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: showModalMock,
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value: closeMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalShowModal) {
      Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShowModal);
    } else {
      Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
    }
    if (originalClose) {
      Object.defineProperty(HTMLDialogElement.prototype, 'close', originalClose);
    } else {
      Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
    }
  });

  it('opens a named native dialog', () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Konfirmasi">
        Isi dialog
      </Modal>,
    );

    expect(screen.getByRole('dialog', { name: 'Konfirmasi' })).toBeInTheDocument();
    expect(showModalMock).toHaveBeenCalledOnce();
  });

  it('does not close when dialog content is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Konfirmasi">
        Isi dialog
      </Modal>,
    );

    fireEvent.click(screen.getByText('Isi dialog'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on backdrop click and reports native close requests', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Konfirmasi">
        Isi dialog
      </Modal>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Konfirmasi' });
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
