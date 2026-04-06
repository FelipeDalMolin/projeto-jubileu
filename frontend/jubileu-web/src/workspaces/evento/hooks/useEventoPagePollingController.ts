import { useEffect, useRef } from "react";

type Channel = {
  enabled: boolean;
  intervalMs: number;
  poll: () => Promise<boolean>;
};

type Params = {
  workspace: Channel;
  timeline: Channel;
  participants: Channel;
};

function createState() {
  return {
    timer: null as ReturnType<typeof setTimeout> | null,
    failures: 0,
    suspendedUntil: 0,
  };
}

export function useEventoPagePollingController(params: Params) {
  const mountedRef = useRef(true);
  const statesRef = useRef({
    workspace: createState(),
    timeline: createState(),
    participants: createState(),
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      (Object.keys(statesRef.current) as Array<keyof typeof statesRef.current>).forEach((key) => {
        const timer = statesRef.current[key].timer;
        if (timer) clearTimeout(timer);
        statesRef.current[key].timer = null;
      });
    };
  }, []);

  useEffect(() => {
    const runChannel = async (name: keyof typeof statesRef.current, channel: Channel) => {
      const state = statesRef.current[name];
      if (!channel.enabled || document.hidden) return;
      const now = Date.now();
      if (state.suspendedUntil > now) return;

      const ok = await channel.poll();
      if (ok) {
        state.failures = 0;
        state.suspendedUntil = 0;
      } else {
        state.failures += 1;
        if (state.failures >= 3) {
          state.suspendedUntil = Date.now() + 30_000;
          state.failures = 0;
        }
      }
    };

    const schedule = (name: keyof typeof statesRef.current, channel: Channel) => {
      const state = statesRef.current[name];
      if (state.timer) clearTimeout(state.timer);
      if (!channel.enabled) return;

      const tick = async () => {
        if (!mountedRef.current) return;
        await runChannel(name, channel);
        const stateNow = statesRef.current[name];
        const now = Date.now();
        const wait =
          stateNow.suspendedUntil > now
            ? Math.max(stateNow.suspendedUntil - now, channel.intervalMs)
            : channel.intervalMs;
        stateNow.timer = setTimeout(tick, wait);
      };

      state.timer = setTimeout(tick, channel.intervalMs);
    };

    schedule("workspace", params.workspace);
    schedule("timeline", params.timeline);
    schedule("participants", params.participants);

    return () => {
      (Object.keys(statesRef.current) as Array<keyof typeof statesRef.current>).forEach((key) => {
        const timer = statesRef.current[key].timer;
        if (timer) clearTimeout(timer);
        statesRef.current[key].timer = null;
      });
    };
  }, [params.participants, params.timeline, params.workspace]);
}
