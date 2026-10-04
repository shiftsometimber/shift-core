import fcntl
def acquire(state):
    state.mkdir(parents=True,exist_ok=True)
    handle=(state/'.checkpoint.lock').open('a')
    fcntl.flock(handle,fcntl.LOCK_EX)
    return handle
