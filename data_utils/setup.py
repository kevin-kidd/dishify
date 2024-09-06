from setuptools import setup, find_packages

setup(
    name="data_utils",
    version="0.1",
    packages=find_packages(include=["scripts", "lib"]),
    install_requires=[
        "pandas",
        "nltk",
        "numpy",
        "tqdm",
    ],
)
