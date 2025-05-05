import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { firstValueFrom } from 'rxjs';

describe('ThemeService', () => {
    let service: ThemeService;
    let localStorageMock: { [key: string]: string };

    beforeEach(() => {
        localStorageMock = {};

        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn((key) => localStorageMock[key]),
                setItem: jest.fn((key, value) => {
                    localStorageMock[key] = value;
                }),
                removeItem: jest.fn((key) => {
                    delete localStorageMock[key];
                })
            },
            writable: true
        });

        TestBed.configureTestingModule({
            providers: [ThemeService]
        });
    });

    describe('Initialization', () => {
        it.skip('should initialize with light theme by default', () => {
            document.documentElement.setAttribute('data-theme', '');
            service = TestBed.inject(ThemeService);
            expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        });

        it('should load saved theme from localStorage', () => {
            document.documentElement.setAttribute('data-theme', '');
            localStorageMock['doci-theme'] = 'dark';
            service = TestBed.inject(ThemeService);
            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        });

        it.skip('should ignore invalid saved theme', () => {
            document.documentElement.setAttribute('data-theme', '');
            localStorageMock['doci-theme'] = 'invalid-theme';
            service = TestBed.inject(ThemeService);
            expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        });
    });

    describe('Theme Toggle', () => {
        beforeEach(() => {
            service = TestBed.inject(ThemeService);
        });

        it('should toggle from light to dark', async () => {
            service.toggleTheme();

            const theme = await firstValueFrom(service.currentTheme$);
            expect(theme).toBe('dark');
            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
            expect(localStorage.setItem).toHaveBeenCalledWith('doci-theme', 'dark');
        });

        it('should toggle from dark to light', async () => {
            // Set initial theme to dark
            service.toggleTheme();

            service.toggleTheme();

            const theme = await firstValueFrom(service.currentTheme$);
            expect(theme).toBe('light');
            expect(document.documentElement.getAttribute('data-theme')).toBe('light');
            expect(localStorage.setItem).toHaveBeenCalledWith('doci-theme', 'light');
        });

        it('should persist theme changes', () => {
            service.toggleTheme();
            expect(localStorage.setItem).toHaveBeenCalledWith('doci-theme', 'dark');
            expect(localStorageMock['doci-theme']).toBe('dark');
        });
    });

    describe('Mermaid Theme', () => {
        beforeEach(() => {
            service = TestBed.inject(ThemeService);
        });

        it('should return neutral theme for light mode', () => {
            expect(service.getMermaidTheme()).toBe('neutral');
        });

        it('should return dark theme for dark mode', () => {
            service.toggleTheme();
            expect(service.getMermaidTheme()).toBe('dark');
        });

        it('should update mermaid theme when main theme changes', () => {
            expect(service.getMermaidTheme()).toBe('neutral');
            service.toggleTheme();
            expect(service.getMermaidTheme()).toBe('dark');
            service.toggleTheme();
            expect(service.getMermaidTheme()).toBe('neutral');
        });
    });

    describe('Theme Observable', () => {
        beforeEach(() => {
            service = TestBed.inject(ThemeService);
        });

        it('should emit initial theme', (done) => {
            service.currentTheme$.subscribe(theme => {
                expect(theme).toBe('light');
                done();
            });
        });

        it('should emit theme changes', (done) => {
            let emissionCount = 0;
            service.currentTheme$.subscribe(theme => {
                emissionCount++;
                if (emissionCount === 1) {
                    expect(theme).toBe('light');
                    service.toggleTheme();
                } else if (emissionCount === 2) {
                    expect(theme).toBe('dark');
                    done();
                }
            });
        });
    });
}); 