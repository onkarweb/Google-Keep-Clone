import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements AfterViewInit {
  title = 'google-keep-frontend';

  @ViewChild('noteArea') noteArea!: ElementRef;
  socket!: Socket;
  connectionStatus: string = 'Connecting...';

  // local user information
  userIcon!: string;
  userId: string = '';

  // remote cursors stored as an object: { [userId]: { x: number, y: number, icon: string } }
  remoteCursors: { [key: string]: { x: number, y: number, icon: string } } = {};

  //https://ui-avatars.com/api/?name=Elon+Musk
  constructor() {
    // For demonstration, choose a random icon from a set of URLs
    const icons = [
      'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=Elon+Musk',
      'https://ui-avatars.com/api/?background=f00&color=fff&name=Onkar+Singh',
      'https://ui-avatars.com/api/?background=DEF831&color=fff&name=Gurleen+Singh',
      'https://ui-avatars.com/api/?background=FF0000&color=fff&name=Json+Fletcher',
      'https://ui-avatars.com/api/?background=000&color=fff&name=Someone+Else',
    ];
    this.userIcon = icons[Math.floor(Math.random() * icons.length)];
  }
  ngAfterViewInit() {
    // Connect to the Socket.IO server
    this.socket = io('http://localhost:3000');

    // Listen for successful connection
    this.socket.on('connect', () => {
      this.connectionStatus = 'Connected';
      console.log('Connected to socket server');
    });

    // Handle connection errors
    this.socket.on('connect_error', (error: any) => {
      console.error('Socket connection error:', error);
      this.connectionStatus = 'Connection error: ' + (error.message || 'unknown error');
    });

    // Handle disconnections
    this.socket.on('disconnect', (reason: any) => {
      console.warn('Socket disconnected:', reason);
      this.connectionStatus = 'Disconnected: ' + reason;
    });

    // Listen for note updates from the server
    this.socket.on('noteUpdate', (content: string) => {
      if (this.noteArea.nativeElement.innerHTML !== content) {
        this.noteArea.nativeElement.innerHTML = content;
      }
    });

      // Listen for cursor updates from remote users
      this.socket.on('cursorUpdate', (data: any) => {
        // Ignore updates from self
        if (data.userId === this.userId) {
          return;
        }
        // If the "remove" flag is set, delete the remote cursor
        if (data.remove) {
          delete this.remoteCursors[data.userId];
        } else {
          this.remoteCursors[data.userId] = {
            x: data.x,
            y: data.y,
            icon: data.icon,
          };
        }
      });
  }


  // Called on every input event in the contenteditable area
  onInput() {
    const content = this.noteArea.nativeElement.innerHTML;
    this.socket.emit('updateNote', content);

    // Also update the cursor position
    this.updateCursor();
  }

  // Apply formatting using document.execCommand and send update
  format(command: string) {
    document.execCommand(command, false);
    this.onInput(); // trigger update after formatting
  }

   // Called on keyup and click events to update the cursor location
   updateCursor() {
    if (!this.noteArea) {
      return;
    }
    const caret = this.getCaretCoordinates();
    if (caret && this.socket) {
      this.socket.emit('cursorUpdate', { x: caret.x, y: caret.y, icon: this.userIcon });
      console.log("CursorUpdate Emitting from FrontEnd", { x: caret.x, y: caret.y, icon: this.userIcon })
      
    }
  }

  // Helper function to compute caret coordinates relative to the note area
  getCaretCoordinates(): { x: number, y: number } | null {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0).cloneRange();
      range.collapse(true);
      const rect = range.getClientRects()[0];
      if (rect) {
        const noteRect = this.noteArea.nativeElement.getBoundingClientRect();
        return { x: rect.left - noteRect.left, y: rect.top - noteRect.top };
      }
    }
    return null;
  }

  // Helper to convert remoteCursors object into an array for *ngFor iteration
  get remoteCursorEntries() {
    console.log("Object.entries(this.remoteCursors): ", Object.entries(this.remoteCursors))
    return Object.entries(this.remoteCursors);
  }
}
