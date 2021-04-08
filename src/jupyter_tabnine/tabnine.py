import json
import logging
import os
import platform
import subprocess
import threading
from urllib.request import urlopen
from urllib.error import HTTPError

if platform.system() == "Windows":
    try:
        from colorama import init
        init(convert=True)
    except ImportError:
        try:
            import pip
            pip.main(['install', '--user', 'colorama'])
            from colorama import init
            init(convert=True)
        except Exception:
            logger = logging.getLogger('ImportError')
            logger.error('Install colorama failed. Install it manually to enjoy colourful log.')


logging.basicConfig(level=logging.INFO,
                    format='\x1b[1m\x1b[33m[%(levelname)s %(asctime)s.%(msecs)03d %(name)s]\x1b[0m: %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S')

_TABNINE_UPDATE_VERSION_URL = "https://update.tabnine.com/version"
_TABNINE_DOWNLOAD_URL_FORMAT = "https://update.tabnine.com/{}"
_SYSTEM_MAPPING = {
    "Darwin": "apple-darwin",
    "Linux": "unknown-linux-gnu",
    "Windows": "pc-windows-gnu",
}
      
class TabNineDownloader(threading.Thread):
    def __init__(self, download_url, output_path):
        threading.Thread.__init__(self)
        self.download_url = download_url
        self.output_path = output_path
        self.logger = logging.getLogger(self.__class__.__name__)

    def run(self):
        output_dir = os.path.dirname(self.output_path)
        try:
            self.logger.info('Begin to download TabNine Binary from %s',
                             self.download_url)
            if not os.path.isdir(output_dir):
                os.makedirs(output_dir)
            with urlopen(self.download_url) as res, \
                open(self.output_path, 'wb') as out:
                out.write(res.read())
            os.chmod(self.output_path, 0o755)
            self.logger.info('Finish download TabNine Binary to %s',
                             self.output_path)
        except Exception as e:
            self.logger.error("Download failed, error: %s", e)


class TabNine(object):
    """
    TabNine python wrapper
    """
    def __init__(self):
        self.name = "tabnine"
        self._proc = None
        self._response = None
        self.logger = logging.getLogger(self.__class__.__name__)
        self._install_dir = os.path.dirname(os.path.realpath(__file__))
        self._binary_dir = os.path.join(self._install_dir, "binaries")
        self.logger.info(" install dir: %s", self._install_dir)
        self.download_if_needed()

    def request(self, data):
        proc = self._get_running_tabnine()
        if proc is None:
            return
        try:
            proc.stdin.write((data + "\n").encode("utf8"))
            proc.stdin.flush()
        except BrokenPipeError:
            self._restart()
            return

        output = proc.stdout.readline().decode("utf8")
        try:
            return json.loads(output)
        except json.JSONDecodeError:
            self.logger.debug("Tabnine output is corrupted: " + output)

    def _restart(self):
        if self._proc is not None:
            self._proc.terminate()
            self._proc = None
        path = get_tabnine_path(self._binary_dir)
        if path is None:
            self.logger.error("no TabNine binary found")
            return
        self._proc = subprocess.Popen(
            [
                path,
                "--client",
                "sublime",
                "--log-file-path",
                os.path.join(self._install_dir, "tabnine.log"),
            ],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
        )

    def _get_running_tabnine(self):
        if self._proc is None:
            self._restart()
        if self._proc is not None and self._proc.poll():
            self.logger.error(
                "TabNine exited with code {}".format(self._proc.returncode)
            )
            self._restart()
        return self._proc

    def download_if_needed(self):
        if os.path.isdir(self._binary_dir):
            tabnine_path = get_tabnine_path(self._binary_dir)
            if tabnine_path is not None:
                os.chmod(tabnine_path, 0o755)
                self.logger.info(
                    "TabNine binary already exists in %s ignore downloading",
                    tabnine_path
                )
                return
        self._download()

    def _download(self):
        tabnine_sub_path = get_tabnine_sub_path()
        binary_path = os.path.join(self._binary_dir, tabnine_sub_path)
        download_url = _TABNINE_DOWNLOAD_URL_FORMAT.format(tabnine_sub_path)
        TabNineDownloader(download_url, binary_path).start()


def get_tabnine_sub_path():
    version = get_tabnine_version()
    architect = parse_architecture(platform.machine())
    system = _SYSTEM_MAPPING[platform.system()]
    execute_name = executable_name("TabNine")
    return "{}/{}-{}/{}".format(version, architect, system, execute_name)


def get_tabnine_version():
    try:
        version = urlopen(_TABNINE_UPDATE_VERSION_URL).read().decode("UTF-8").strip()
        return version
    except HTTPError:
        return None


def get_tabnine_path(binary_dir):
    versions = os.listdir(binary_dir)
    versions.sort(key=parse_semver, reverse=True)
    for version in versions:
        triple = "{}-{}".format(
            parse_architecture(platform.machine()), _SYSTEM_MAPPING[platform.system()]
        )
        path = os.path.join(binary_dir, version, triple, executable_name("TabNine"))
        if os.path.isfile(path):
            return path
    return None


# Adapted from the sublime plugin
def parse_semver(s):
    try:
        return [int(x) for x in s.split(".")]
    except ValueError:
        return []


def parse_architecture(arch):
    if arch == "AMD64":
        return "x86_64"
    else:
        return arch


def executable_name(name):
    if platform.system() == "Windows":
        return name + ".exe"
    else:
        return name
