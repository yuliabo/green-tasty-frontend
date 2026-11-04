import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { GuestInviteService } from '../reservation/guest-invite.service';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';
import { map, Observable, switchMap } from 'rxjs';
import { GuestInvite } from '@app/models/reservations/guest-invite.model';
import { GroupSessionsResponse } from '@app/models/group-orders/group-sessions-response.model';
import { OwnerSessionResponse } from '@app/models/group-orders/owner-session.model';
import { GroupStatusResponse } from '@app/models/group-orders/group-status.model';
import { SubmittedDish } from '@app/models/group-orders/submit-group-pre-order.model';
import { SKIP_ERROR_TOAST } from '@app/auth/skip-error-toast.context';
import { AuthenticationService } from '@app/auth/services/authentication.service';

@Injectable({
  providedIn: 'root'
})
export class GroupOrdersService {
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly http = inject(HttpClient);
  private guestInviteService = inject(GuestInviteService);
  private readonly authenticationService = inject(AuthenticationService);

  getGroupInvite$(reservationId: string):
    Observable<GuestInvite> {
    return this.guestInviteService.getInviteToken$(reservationId).pipe(
      map(inviteToken => inviteToken.token),
      switchMap(token => this.guestInviteService.getInvite$(token))
    )
  }

  getSessions$(groupReservationId: string, options?: { silent?: boolean }): Observable<GroupSessionsResponse> {
    return this.http.get<GroupSessionsResponse>(`${this.baseUrl}/guest/groups/${groupReservationId}/sessions`, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, !!options?.silent),
      headers: this.ownerHeaders(),
    })
  }

  getOwnerSessionId$(reservationId: string): Observable<string> {
    return this.http.get<OwnerSessionResponse>(`${this.baseUrl}/reservations/${reservationId}/guest-session-id`).pipe(map(res => res.guestSessionId))
  }

  getStatus$(groupReservationId: string, options?: { silent?: boolean }): Observable<GroupStatusResponse> {
    return this.http.get<GroupStatusResponse>(`${this.baseUrl}/guest/groups/${groupReservationId}/status`, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, !!options?.silent),
      headers: this.ownerHeaders(),
    });
  }

  submit$(groupReservationId: string, reservationId: string): Observable<SubmittedDish[]> {
    return this.http.post<SubmittedDish[]>(`${this.baseUrl}/group-reservations/${groupReservationId}/submit`, { reservationId })
  }


  private ownerHeaders(): HttpHeaders {
    const tokens = this.authenticationService.getTokens();

    return tokens
      ? new HttpHeaders({ Authorization: `Bearer ${tokens.idToken}` })
      : new HttpHeaders();
  }
}
