import json
import unittest

from .__init__ import get_absolute_character_position


class AbsolutePositionTest(unittest.TestCase):
    def test(self):
        code = '"def plot_digit(data):\\n    image = data.reshape(28, 28)\\n    plt.imshow(image,' \
               ' cmap = matplotlib.cm.binary,\\n               interpolation=\\"nearest\\")\\n    plt.axis(\\"off\\")"'
        code = json.loads(code)
        code_as_list = code.split('\n')
        self.assertEqual(code[get_absolute_character_position(code_as_list, 25, 1)], '2')

    def test2(self):
        code = "#%matplotlib inline\nimport matplotlib\nimport matplotlib.pyplot as plt\n\nsome_digit = X[36000]\n" \
               "some_digit_image = some_digit.reshape(28, 28)\nplt.imshow(some_digit_image, cmap = matplotlib.cm." \
               "binary,\n           interpolation=\"nearest\")\nplt.axis(\"off\")\n\nsave_fig(\"some_digit_plot\")\n" \
               "plt.show()"
        code_as_list = code.split('\n')
        self.assertEqual(code[get_absolute_character_position(code_as_list, 38, 5)], '2')
