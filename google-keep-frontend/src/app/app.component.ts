import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { io } from 'socket.io-client';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements AfterViewInit {
  title = 'google-keep-frontend';

  @ViewChild('noteArea') noteArea!: ElementRef;
  socket: any;
  connectionStatus: string = 'Connecting...';


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
  }


  // ngAfterViewInit() {
  //   // Connect to the Socket.IO server (adjust the URL/port if needed)
  //   this.socket = io('http://localhost:3000');

  //   // Listen for note updates from the server
  //   this.socket.on('noteUpdate', (content: string) => {
  //     // Only update if content differs (avoid overwriting local changes)
  //     if (this.noteArea.nativeElement.innerHTML !== content) {
  //       this.noteArea.nativeElement.innerHTML = content;
  //     }
  //   });
  // }

  // Called on every input event in the contenteditable area
  onInput() {
    const content = this.noteArea.nativeElement.innerHTML;
    this.socket.emit('updateNote', content);
  }

  // Apply formatting using document.execCommand and send update
  format(command: string) {
    document.execCommand(command, false);
    this.onInput(); // trigger update after formatting
  }
}
