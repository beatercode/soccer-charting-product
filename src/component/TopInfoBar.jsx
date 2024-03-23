const TopInfoBar = () => {
  return (
    <p className="announcement-bar">
      <svg viewBox="0 0 1024 1024" width="16" height="16">
        <path
          d="M512 184c44.3 0 87.3 8.7 127.6 25.7 39 16.5 74.1 40.2 104.3 70.3 30.2 30.2 53.8 65.3 70.3 104.3C831.3 424.7 840 467.7 840 512s-8.7 87.3-25.7 127.6c-16.5 39-40.2 74.1-70.3 104.3-30.2 30.2-65.3 53.8-104.3 70.3C599.3 831.3 556.3 840 512 840s-87.3-8.7-127.6-25.7c-39-16.5-74.1-40.2-104.3-70.3-30.2-30.2-53.8-65.3-70.3-104.3C192.7 599.3 184 556.3 184 512s8.7-87.3 25.7-127.6c16.5-39 40.2-74.1 70.3-104.3s65.3-53.8 104.3-70.3C424.7 192.7 467.7 184 512 184m0-120C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z"
          fill="#006EFF"
        />
        <path d="M452 464.5h120v300H452z" fill="#006EFF" />
        <path d="M512 323.3m-60 0a60 60 0 1 0 120 0 60 60 0 1 0-120 0Z" fill="#006EFF" />
      </svg>
      &nbsp; Soccer Chart/Graph for Gambling and Testing&nbsp;
      {/* eslint-disable-next-line */}
      <a target="_blank" rel="noreferrer noopener" href="https://polygon.io">
        website-inc.ai
      </a>
      &nbsp; Source code&nbsp;
      {/* eslint-disable-next-line */}
      <a target="_blank" rel="noreferrer noopener" href="">
        todo
      </a>
    </p>
  );
};

export default TopInfoBar;
