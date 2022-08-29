import classnames from "classnames/bind";
import skrambler from "kube-skrambler";
import type { NextPage } from "next";
import { useEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";

var spaceDownedAt: Date | undefined = undefined;

const cx = classnames.bind(styles);

interface TimeProps {
  startedAt: Date | undefined;
  stoppedAt: Date | undefined;
  duration: number;
}

const Time: React.FC<TimeProps> = ({ startedAt, stoppedAt, duration }) => {
  const durationInSeconds = duration / 1000;
  return <span>{durationInSeconds.toFixed(2)}</span>;
};

const Home: NextPage = () => {
  const [scramble, setscramble] = useState("");
  const [oldScramble, setoldScramble] = useState("");
  // const [startedAt, setstartedAt] = useState<Date>();
  const [pressed, setpressed] = useState(false);
  const [pressedLongEnough, setpressedLongEnough] = useState(false);
  const [duration, setduration] = useState<number>(0);
  const [times, settimes] = useState<number[]>([]);

  const lastRegisteredScramble = useRef("");
  const previousFrameTimestamp = useRef<number>(0);
  const requestAnimationFrameId = useRef<number>(0);
  const requestPressAnimationFrameId = useRef<number>(0);
  const startedAtRef = useRef<Date>();
  const stoppedAtRef = useRef<Date>();

  const average = times.reduce((a, b) => a + b, 0) / times.length / 1000;

  const isIdle = () =>
    Boolean(startedAtRef.current) && Boolean(stoppedAtRef.current);

  const isOngoing = () =>
    Boolean(startedAtRef.current) && !Boolean(stoppedAtRef.current);

  const setstartedAt = (date: Date | undefined) => {
    startedAtRef.current = date;
  };

  const setstoppedAt = (date: Date | undefined) => {
    stoppedAtRef.current = date;
  };

  const animateTimer = (time: number) => {
    if (time - previousFrameTimestamp.current > 50) {
      if (startedAtRef.current) {
        const now = new Date();
        const duration = now.getTime() - startedAtRef.current.getTime();
        setduration(duration);
      }

      previousFrameTimestamp.current = time;
    }

    requestAnimationFrameId.current = requestAnimationFrame(animateTimer);
  };

  const animatePress = (time: number) => {
    if (!spaceDownedAt) {
      return;
    }

    const now = new Date();

    const duration = now.getTime() - spaceDownedAt.getTime();
    if (duration > 300) {
      setpressedLongEnough(true);
    }

    requestPressAnimationFrameId.current = requestAnimationFrame(animatePress);
  };

  const getScramble = () => {
    const newScramble = skrambler.get({ category: "ZBLL" });
    setscramble(newScramble);

    if (lastRegisteredScramble.current) {
      setoldScramble(lastRegisteredScramble.current);
    }

    lastRegisteredScramble.current = newScramble;
  };

  useEffect(() => {
    getScramble();

    // Init event listeners
    document.body.addEventListener("keydown", handleKeyDown);
    document.body.addEventListener("keyup", handleKeyUp);

    return () => {
      document.body.removeEventListener("keydown", handleKeyDown);
      document.body.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (isOngoing()) {
      stop();
      return;
    }

    if (event.key === "Escape" && isIdle()) {
      reset();
      return;
    }

    if (event.key !== " ") {
      return;
    }

    setpressed(true);

    if (spaceDownedAt) {
      return;
    }

    requestAnimationFrame(animatePress);

    spaceDownedAt = new Date();
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.key !== " ") {
      return;
    }

    const now = new Date();

    if (spaceDownedAt) {
      setpressed(false);
      setpressedLongEnough(false);
      const duration = now.getTime() - spaceDownedAt.getTime();

      if (duration > 300) {
        start();
      }

      spaceDownedAt = undefined;
    }
  };

  const reset = () => {
    setstartedAt(undefined);
    setstoppedAt(undefined);
    setduration(0);
  };

  const start = () => {
    // Reset date timers
    setstartedAt(new Date());
    setstoppedAt(undefined);
    requestAnimationFrame(animateTimer);
  };

  const stop = () => {
    // Stop timer
    setstoppedAt(new Date());
    cancelAnimationFrame(requestAnimationFrameId.current);
    cancelAnimationFrame(requestPressAnimationFrameId.current);

    // Calculate duration
    if (startedAtRef.current && stoppedAtRef.current) {
      const duration =
        stoppedAtRef.current.getTime() - startedAtRef.current.getTime();

      settimes((times) => [...times, duration]);
    }

    // Get new scramble
    getScramble();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>{scramble}</header>
      <div className={cx("timer", { pressed, pressedLongEnough })}>
        <Time
          startedAt={startedAtRef.current}
          stoppedAt={startedAtRef.current}
          duration={duration}
        />
      </div>
      <header className={styles.header}>{oldScramble}</header>
      <header className={styles.header}>Average {average.toFixed(2)}</header>
    </div>
  );
};

export default Home;
