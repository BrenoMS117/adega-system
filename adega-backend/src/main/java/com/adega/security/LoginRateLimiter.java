package com.adega.security;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 10;
    private static final int WINDOW_MINUTES = 5;
    private static final int BLOCK_MINUTES = 15;

    private final ConcurrentHashMap<String, LoginAttempts> attempts = new ConcurrentHashMap<>();

    public boolean isBlocked(String ip) {
        LoginAttempts entry = attempts.get(ip);
        return entry != null
                && entry.blockedUntil != null
                && LocalDateTime.now().isBefore(entry.blockedUntil);
    }

    public void registerAttempt(String ip) {
        attempts.compute(ip, (key, entry) -> {
            LocalDateTime now = LocalDateTime.now();
            if (entry == null || entry.firstAttempt.plusMinutes(WINDOW_MINUTES).isBefore(now)) {
                return new LoginAttempts(1, now, null);
            }
            entry.count++;
            if (entry.count >= MAX_ATTEMPTS) {
                entry.blockedUntil = now.plusMinutes(BLOCK_MINUTES);
            }
            return entry;
        });
    }

    public void registerSuccess(String ip) {
        attempts.remove(ip);
    }

    @Scheduled(fixedDelay = 30 * 60 * 1000)
    public void cleanup() {
        LocalDateTime now = LocalDateTime.now();
        attempts.entrySet().removeIf(e -> {
            LoginAttempts a = e.getValue();
            boolean windowExpired = a.firstAttempt.plusMinutes(WINDOW_MINUTES).isBefore(now);
            boolean blockExpired = a.blockedUntil == null || a.blockedUntil.isBefore(now);
            return windowExpired && blockExpired;
        });
    }

    private static class LoginAttempts {
        int count;
        LocalDateTime firstAttempt;
        LocalDateTime blockedUntil;

        LoginAttempts(int count, LocalDateTime firstAttempt, LocalDateTime blockedUntil) {
            this.count = count;
            this.firstAttempt = firstAttempt;
            this.blockedUntil = blockedUntil;
        }
    }
}
