import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

type MermaidTheme = 'default' | 'base' | 'dark' | 'forest' | 'neutral' | 'null';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly THEME_KEY = 'doci-theme';
    private _currentTheme = new BehaviorSubject<'light' | 'dark'>('light');
    public currentTheme$: Observable<'light' | 'dark'> = this._currentTheme.asObservable();

    constructor() {
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem(this.THEME_KEY) as 'light' | 'dark';
        if (savedTheme) {
            this._currentTheme.next(savedTheme);
            this.applyTheme(savedTheme);
        }
    }

    toggleTheme(): void {
        const newTheme = this._currentTheme.value === 'light' ? 'dark' : 'light';
        this._currentTheme.next(newTheme);
        this.applyTheme(newTheme);
        localStorage.setItem(this.THEME_KEY, newTheme);
    }

    getMermaidTheme(): MermaidTheme {
        return this._currentTheme.value === 'dark' ? 'dark' : 'neutral';
    }

    private applyTheme(theme: 'light' | 'dark'): void {
        document.documentElement.setAttribute('data-theme', theme);
    }
} 