export let appConfirm: (message: string, onConfirm: () => void) => void = () => {
    console.warn('appConfirm not initialized');
};

export const bindAppConfirm = (handler: typeof appConfirm) => {
    appConfirm = handler;
};
