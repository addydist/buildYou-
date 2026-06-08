let tokenGetter: (() => Promise<string | null>) | null = null;

export const setTokenGetter = (fn: () => Promise<string | null>) => {
  tokenGetter = fn;
};

export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = tokenGetter ? await tokenGetter() : null;
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers as Record<string, string>),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};
